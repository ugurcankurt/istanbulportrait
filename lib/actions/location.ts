"use server";

import { Country, State } from "country-state-city";

/**
 * Server Action to fetch all countries.
 * Returns only the necessary fields to keep the payload size minimal.
 */
export async function getCountriesAction() {
  try {
    const countries = Country.getAllCountries();
    return countries.map((country) => ({
      name: country.name,
      isoCode: country.isoCode,
      flag: country.flag,
    }));
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}

/**
 * Server Action to fetch states for a specific country.
 * Returns only the necessary fields.
 */
export async function getStatesForCountryAction(countryCode: string) {
  if (!countryCode) return [];
  
  try {
    const states = State.getStatesOfCountry(countryCode);
    return states.map((state) => ({
      name: state.name,
      isoCode: state.isoCode,
    }));
  } catch (error) {
    console.error(`Error fetching states for country ${countryCode}:`, error);
    return [];
  }
}
