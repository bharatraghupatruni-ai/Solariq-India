"use client";

import { useState, useEffect } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useLocation } from "@/hooks/useLocation";
import { STATE_OPTIONS } from "@/lib/constants/states";
// Allow free-form city names, as they are resolved via the pincode DB.

export function Step1Location() {
  const { setLocation, wizard } = useAnalysisStore();
  const { latitude, longitude, loading, error, requestLocation } = useLocation();

  const [address, setAddress] = useState(wizard.location?.address ?? "");
  const [city, setCity] = useState(wizard.location?.city ?? "");
  const [state, setState] = useState(wizard.location?.state ?? "");
  const [pincode, setPincode] = useState(wizard.location?.pincode ?? "");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: wizard.location?.latitude ?? null,
    lng: wizard.location?.longitude ?? null,
  });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const canProceed = city && state && (latitude !== null || coords.lat !== null || address);

  // Auto-reverse geocode GPS location
  useEffect(() => {
    if (latitude && longitude) {
      setCoords({ lat: latitude, lng: longitude });
      
      const reverseGeocode = async () => {
        setLookupLoading(true);
        setLookupError("");
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "SolarIQ-Feasibility-App/1.0"
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const detectedPincode = data.address.postcode || "";
              const detectedCity = data.address.city || data.address.town || data.address.village || data.address.suburb || "";
              const detectedState = data.address.state || "";
              
              // First try using the detected pincode to perform a local DB lookup, which is most accurate
              let dbResolved = false;
              const cleanPincode = detectedPincode.replace(/\s+/g, "");
              if (cleanPincode && cleanPincode.length === 6 && /^\d+$/.test(cleanPincode)) {
                setPincode(cleanPincode);
                try {
                  const dbRes = await fetch(`/api/ml/pincode?pincode=${cleanPincode}`);
                  if (dbRes.ok) {
                    const dbData = await dbRes.json();
                    if (dbData && dbData.city) {
                      // Do not auto-predict city/state to allow manual user entry
                      dbResolved = true;
                    }
                  }
                } catch (dbErr) {
                  console.error("GPS auto-pincode lookup error:", dbErr);
                }
              }

              // Fallback to Nominatim address parsing if local DB lookup didn't resolve the location fully
              if (!dbResolved) {
                if (cleanPincode) {
                  setPincode(cleanPincode);
                }
                // Do not auto-predict city/state to allow manual user entry
              }
            }
          }
        } catch (err) {
          console.error("GPS Reverse Geocoding Error:", err);
        } finally {
          setLookupLoading(false);
        }
      };
      reverseGeocode();
    }
  }, [latitude, longitude]);

  const handlePincodeChange = async (val: string) => {
    setPincode(val);
    if (val.length === 6 && /^\d+$/.test(val)) {
      setLookupLoading(true);
      setLookupError("");
      try {
        const res = await fetch(`/api/ml/pincode?pincode=${val}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.city) {
            // Do not auto-predict city/state to allow manual user entry
            setCoords({ lat: data.latitude, lng: data.longitude });
          }
        } else {
          setLookupError("PIN Code not found in our database");
        }
      } catch (err) {
        console.error("Pincode lookup error:", err);
      } finally {
        setLookupLoading(false);
      }
    }
  };

  const handleNext = () => {
    setLocation({
      latitude: coords.lat ?? latitude ?? 20.5937,
      longitude: coords.lng ?? longitude ?? 78.9629,
      address,
      city,
      state,
      pincode,
    });
  };

  return (
    <div className="step-transition">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="font-label-md text-xs text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest font-semibold">
            Feasibility Engine
          </span>
          <h1 className="font-headline-lg text-3xl font-bold text-primary mt-4 mb-6 font-serif leading-tight">
            Where is your project located?
          </h1>
          <p className="font-body-md text-sm text-stone-500 mb-8 leading-relaxed">
            Pincode helps us calculate local irradiance, sun hours, and available government subsidies in your region.
          </p>

          <div className="space-y-6">
            {/* Geolocation Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setCoords({ lat: null, lng: null });
                  requestLocation();
                }}
                disabled={loading}
                className="w-full py-3.5 bg-white border border-stone-250 hover:bg-stone-50 text-stone-700 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-semibold animate-pulse text-amber-500">
                  navigation
                </span>
                {loading ? "Detecting..." : latitude ? "Location detected ✓" : "Use current GPS location"}
              </button>
              {error && <p className="text-[10px] text-red-500 mt-1.5 font-medium">{error}</p>}
            </div>

            {/* Pincode Input */}
            <div className="relative">
              <label className="font-label-md text-xs font-semibold block mb-2 text-stone-500">
                Enter Pincode
              </label>
              <input
                className="w-full h-16 bg-stone-100/50 border border-stone-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-2xl px-6 font-semibold text-lg text-primary outline-none transition-all neomorphic-inset"
                maxLength={6}
                placeholder="400001"
                type="text"
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
              />
              <span className="absolute right-6 top-11 material-symbols-outlined text-primary">
                location_on
              </span>
            </div>

            {/* PIN Code search status */}
            <div className="space-y-1">
              {lookupLoading && (
                <span className="text-[10px] text-amber-600 font-semibold animate-pulse block">
                  Searching PIN Code...
                </span>
              )}
              {lookupError && (
                <span className="text-[10px] text-red-500 font-semibold block">
                  {lookupError}
                </span>
              )}
              {coords.lat && !lookupLoading && (
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  ✓ Coords resolved: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}
                </span>
              )}
            </div>

            {/* City, State & DISCOM Info Cards */}
            {(city || state) && (
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="font-label-md text-xs text-stone-400 font-medium">City/State</p>
                  <p className="font-body-md text-sm font-bold text-primary capitalize mt-0.5">
                    {city ? city.replace(/_/g, " ") : "Pending"}
                  </p>
                </div>
                <div className="flex-1 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="font-label-md text-xs text-stone-400 font-medium">DISCOM</p>
                  <p className="font-body-md text-sm font-bold text-primary mt-0.5">
                    {state
                      ? STATE_OPTIONS.find((opt) => opt.value === state)?.label || "Local DISCOM"
                      : "Pending"}
                  </p>
                </div>
              </div>
            )}

            {/* Verification Inputs */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/60 space-y-4 shadow-sm text-left">
              <span className="text-xs font-bold text-stone-750 uppercase tracking-wider block">
                Verify Details Manually
              </span>
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">City *</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-12 px-4 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">State *</label>
                  <div className="relative">
                    <select
                      className="w-full h-12 px-4 pr-10 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset appearance-none cursor-pointer"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {STATE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none material-symbols-outlined text-primary text-lg">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">Street address (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 MG Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-12 px-4 bg-stone-100/50 border border-stone-200 rounded-xl font-medium text-sm text-primary outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all neomorphic-inset"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side illustration card */}
        <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl hidden md:block">
          <img
            className="w-full h-full object-cover"
            alt="Mumbai Skyline sunset"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs_HXPlVK1cNd3mDtDwkfF3EPYg5w85d75V1scYTV_GHyyv-GNN3O8ugJr9wrgfqda8y-2nOtEpnAE1iHPb4Dh8BbefGDTYNCBYpt24v_1eqkz8dDM5GIQaOcZ8GyAbRUDh8wCggaWXPIMuJQy3_I5RXsPQWH5uwT2cqwQ-1y-qr-iRXztP9s-hNU1IYZ5OJH6Pg7vJBIdiMg0FkoApDXJ0GWz6im21Zv864L3glRUNJtQnCQj5sSR6p9OigCru6zGHBTCjP3fL_Y"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <span className="material-symbols-outlined mb-2 text-white font-semibold">radar</span>
            <p className="font-label-md text-[10px] uppercase tracking-wider opacity-80">Signal Strength</p>
            <p className="font-headline-md text-xl font-bold font-serif mt-0.5">High Coverage Area</p>
          </div>
        </div>
      </div>

      {/* Button controls */}
      <div className="mt-12 pt-8 border-t border-stone-200/50 flex justify-between items-center">
        <div className="flex-grow"></div>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <span className="material-symbols-outlined text-sm font-semibold">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
