import { Location, PriceData } from "@/lib/types";

const FALLBACK_PRICE_DATA: PriceData = {
  currency: "USD",
  products: [
    {
      name: "Pro",
      monthly: {
        price: 20.0,
        stripe_price_id: "price_1RAe9TK8Jk6Q3TjGg3nC0pha",
        formatted_price: "$20",
        interval: "month",
        interval_count: 1,
        billing_scheme: "per_unit",
        metadata: {
          original_price_id: "price_1RAe9TK8Jk6Q3TjGg3nC0pha",
          description: "Pro monthly subscription",
          trial_period_days: null,
        },
      },
      yearly: {
        price: 144.0,
        stripe_price_id: "price_1RAeGDK8Jk6Q3TjGEbodrwlS",
        formatted_price: "$144",
        interval: "year",
        interval_count: 1,
        billing_scheme: "per_unit",
        metadata: {
          original_price_id: "price_1RAeGDK8Jk6Q3TjGEbodrwlS",
          description: "Pro yearly subscription",
          trial_period_days: null,
        },
      },
    },
  ],
  name: "1Learn",
};

const FALLBACK_LOCATION_DATA: Location = {
  status: "success",
  country: "US",
  countryCode: "US",
  region: "California",
  regionName: "California",
  city: "San Francisco",
  isp: "ISP",
  lat: 37.7749,
  lon: -122.4194,
  org: "ISP",
  query: "127.0.0.1",
};

export const getPrice = async (
  user: string,
  country: string,
): Promise<PriceData | undefined> => {
  try {
    const requestData = {
      user: user,
      country: country,
    };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/prices/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      },
    );

    if (!response.ok) {
      return FALLBACK_PRICE_DATA;
    }

    const data: PriceData = await response.json();
    return data;
  } catch (error) {
    return FALLBACK_PRICE_DATA;
  }
};

export const getLocation = async (): Promise<Location> => {
  try {
    const response = await fetch(
      `https://pro.ip-api.com/json/?fields=61439&key=${process.env.NEXT_PUBLIC_IP_API_KEY}`,
    );

    if (!response.ok) {
      return FALLBACK_LOCATION_DATA;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return FALLBACK_LOCATION_DATA;
  }
};
