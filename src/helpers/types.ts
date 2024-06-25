export interface PrayerTimes {
  [date: string]: {
    fajr: string;
    sunrise: string;
    zawaal_start: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}
