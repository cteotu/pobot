import { differenceInHours, isWithinInterval } from 'date-fns';

export const roundToNearestBucket = (tempF: number, bucketSize: number = 1): number => {
  return Math.round(tempF / bucketSize) * bucketSize;
};

export const getBucketRange = (centerTemp: number, bucketSize: number = 1): string => {
  const low = centerTemp - bucketSize/2;
  const high = centerTemp + bucketSize/2;
  return `${low}-${high}°F`;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isMarketActive = (expirationDate: Date): boolean => {
  const hoursUntilExpiry = differenceInHours(expirationDate, new Date());
  return hoursUntilExpiry > 1; // 1 saatten az kalan piyasalara girme
};

export const calculateExpectedValue = (probability: number, marketPrice: number): number => {
  if (marketPrice <= 0 || marketPrice >= 1) return 0;
  return probability - marketPrice;
};
