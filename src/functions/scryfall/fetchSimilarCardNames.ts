import { SCRYFALL_API_BASE } from "./constants";

export const fetchSimilarCardNames = async (
  cardName: string
): Promise<string[]> => {
  try {
    const response = await fetch(
      `${SCRYFALL_API_BASE}/cards/search?q=${encodeURIComponent(
        cardName
      )}&unique=cards&order=edhrec`
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch suggestions for ${cardName}: ${response.status}`
      );
      return [];
    }

    const data = await response.json();
    return (
      data.data?.map((card: { name: string }) => card.name).slice(0, 10) || []
    );
  } catch (error) {
    console.error(`Error fetching suggestions for ${cardName}:`, error);
    return [];
  }
};
