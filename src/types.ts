export interface Card {
  quantity: number;
  name: string;
  requestedSet?: string;
  requestedCollectorNumber?: string;
  hasCustomImage?: boolean;
}

export interface Deck {
  cards: Card[];
  numCards: number;
  numUniqueCards: number;
}

export interface CardWithMetadata extends Card {
  allPrintings: ScryfallCard[];
  selectedIndex: number;
  customImageUrl?: string;
  imageUrls: string[];
  isDoubleFaced: boolean;
}

export interface DeckWithMetadata extends Deck {
  cards: CardWithMetadata[];
}

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
      art_crop: string;
      border_crop: string;
    };
  }>;
}

export interface ScryfallSearchResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
}

export type StatusType = "success" | "error" | "info" | "";
