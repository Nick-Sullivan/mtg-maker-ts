import { useCallback, useEffect, useRef, useState } from "react";
import { CardArtModal } from "../../components/CardArtModal/CardArtModal";
import { CardSuggestionsModal } from "../../components/CardSuggestionsModal/CardSuggestionsModal";
import {
  fetchAllPrintings,
  getPrintingImageUrls,
  proxyScryfallUrl,
} from "../../functions/scryfall/fetchCardArt";
import { CardWithMetadata } from "../../types";
import { CardInputRow } from "./CardInputRow";
import "./DeckShowcase.css";
import { CANVAS_SIZE, DrawState, drawShowcase } from "./drawShowcase";
import { loadImage } from "./imageLoader";

interface ShowcaseCard extends CardWithMetadata {
  colorIdentity: string[];
  loading: boolean;
  error: boolean;
}

interface ShowcaseExport {
  version: number;
  title: string;
  bracket: string;
  description: string;
  deckUrl: string;
  manualColorIdentity: string[] | null;
  showColorIcons: boolean;
  commanders: { name: string; scryfallId?: string }[];
  keyCards: { name: string; scryfallId?: string }[];
}

type CardRole = `commander-${number}` | `key-${number}`;

function emptyCard(name: string): ShowcaseCard {
  return {
    quantity: 1,
    name,
    allPrintings: [],
    selectedIndex: 0,
    imageUrls: [],
    isDoubleFaced: false,
    colorIdentity: [],
    loading: false,
    error: false,
  };
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
}

export function DeckShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [title, setTitle] = useState("Speedrun");
  const [bracket, setBracket] = useState("Bracket 1 - Exhibition");
  const [description, setDescription] = useState(
    "Lose the game on the first turn.",
  );

  const [commanderNames, setCommanderNames] = useState<string[]>([
    "Phage the Untouchable",
  ]);
  const [commanders, setCommanders] = useState<(ShowcaseCard | null)[]>([null]);
  const [commanderImgs, setCommanderImgs] = useState<
    (HTMLImageElement | null)[]
  >([null]);

  const [keyNames, setKeyNames] = useState<string[]>([
    "Black Lotus",
    "Blacker Lotus",
  ]);
  const [keys, setKeys] = useState<(ShowcaseCard | null)[]>([null, null]);
  const [keyImgs, setKeyImgs] = useState<(HTMLImageElement | null)[]>([
    null,
    null,
  ]);

  const [deckUrl, setDeckUrl] = useState("");
  const [qrImg, setQrImg] = useState<HTMLImageElement | null>(null);
  const debouncedDeckUrl = useDebounce(deckUrl, 600);

  const [manualColorIdentity, setManualColorIdentity] = useState<
    string[] | null
  >(["B"]);
  const [showColorIcons, setShowColorIcons] = useState(true);

  const [colorIconImgs, setColorIconImgs] = useState<
    Partial<Record<string, HTMLImageElement>>
  >({});

  useEffect(() => {
    Promise.all(
      ["W", "U", "B", "R", "G"].map(async (c) => {
        try {
          const img = await loadImage(
            proxyScryfallUrl(`https://svgs.scryfall.io/card-symbols/${c}.svg`),
          );
          return [c, img] as const;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      const entries = results.filter(
        (r): r is [string, HTMLImageElement] => r !== null,
      );
      setColorIconImgs(Object.fromEntries(entries));
    });
  }, []);

  const [modalCard, setModalCard] = useState<ShowcaseCard | null>(null);
  const [modalRole, setModalRole] = useState<CardRole | null>(null);

  const [suggestCard, setSuggestCard] = useState<ShowcaseCard | null>(null);
  const [suggestRole, setSuggestRole] = useState<CardRole | null>(null);

  const debouncedCommanderNames = useDebounce(commanderNames, 600);
  const debouncedKeyNames = useDebounce(keyNames, 600);

  const fetchCard = useCallback(
    async (name: string): Promise<ShowcaseCard | null> => {
      if (!name.trim()) return null;
      const printings = await fetchAllPrintings(name.trim());
      if (printings.length === 0) return { ...emptyCard(name), error: true };
      const { imageUrls, isDoubleFaced } = getPrintingImageUrls(printings[0]);
      return {
        quantity: 1,
        name,
        allPrintings: printings,
        selectedIndex: 0,
        imageUrls,
        isDoubleFaced,
        colorIdentity: printings[0].color_identity ?? [],
        loading: false,
        error: false,
      };
    },
    [],
  );

  const loadImg = useCallback(async (card: ShowcaseCard | null) => {
    if (!card || card.imageUrls.length === 0) return null;
    try {
      return await loadImage(proxyScryfallUrl(card.imageUrls[0]));
    } catch {
      return null;
    }
  }, []);

  const prevCommanderNames = useRef<string[]>([]);
  useEffect(() => {
    const prev = prevCommanderNames.current;
    prevCommanderNames.current = debouncedCommanderNames;
    const changed = debouncedCommanderNames.map((name, i) => name !== prev[i]);

    setCommanders((c) =>
      debouncedCommanderNames.map((name, i) =>
        changed[i] && name.trim()
          ? {
              ...(c[i] ?? emptyCard(name)),
              imageUrls: [],
              loading: true,
              error: false,
            }
          : (c[i] ?? null),
      ),
    );
    setCommanderImgs((imgs) => imgs.map((img, i) => (changed[i] ? null : img)));

    Promise.all(
      debouncedCommanderNames.map((name, i) =>
        changed[i] ? fetchCard(name) : null,
      ),
    ).then(async (results) => {
      setCommanders((c) =>
        c.map((card, i) => (results[i] !== null ? results[i] : card)),
      );
      const newImgs = await Promise.all(
        results.map((r) => (r !== null ? loadImg(r) : Promise.resolve(null))),
      );
      setCommanderImgs((imgs) =>
        imgs.map((img, i) => (results[i] !== null ? newImgs[i] : img)),
      );
    });
  }, [debouncedCommanderNames, fetchCard, loadImg]);

  const prevKeyNames = useRef<string[]>([]);
  useEffect(() => {
    const prev = prevKeyNames.current;
    prevKeyNames.current = debouncedKeyNames;
    const changed = debouncedKeyNames.map((name, i) => name !== prev[i]);

    setKeys((k) =>
      debouncedKeyNames.map((name, i) =>
        changed[i] && name.trim()
          ? {
              ...(k[i] ?? emptyCard(name)),
              imageUrls: [],
              loading: true,
              error: false,
            }
          : (k[i] ?? null),
      ),
    );
    setKeyImgs((imgs) => imgs.map((img, i) => (changed[i] ? null : img)));

    Promise.all(
      debouncedKeyNames.map((name, i) => (changed[i] ? fetchCard(name) : null)),
    ).then(async (results) => {
      setKeys((k) =>
        k.map((card, i) => (results[i] !== null ? results[i] : card)),
      );
      const newImgs = await Promise.all(
        results.map((r) => (r !== null ? loadImg(r) : Promise.resolve(null))),
      );
      setKeyImgs((imgs) =>
        imgs.map((img, i) => (results[i] !== null ? newImgs[i] : img)),
      );
    });
  }, [debouncedKeyNames, fetchCard, loadImg]);

  useEffect(() => {
    if (!debouncedDeckUrl.trim()) {
      setQrImg(null);
      return;
    }
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(debouncedDeckUrl)}&size=300x300&margin=0`;
    loadImage(url)
      .then(setQrImg)
      .catch(() => setQrImg(null));
  }, [debouncedDeckUrl]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const state: DrawState = {
      title,
      bracket,
      description,
      keyCardImgs: keyImgs,
      commanderImg: commanderImgs[0] ?? null,
      altImgs: commanderImgs.slice(1),
      colorIdentity: manualColorIdentity ?? commanders[0]?.colorIdentity ?? [],
      colorIcons: colorIconImgs,
      showColorIcons,
      qrImg,
    };
    document.fonts.ready.then(() => drawShowcase(canvas, state));
  }, [
    title,
    bracket,
    description,
    keyImgs,
    commanderImgs,
    commanders,
    colorIconImgs,
    showColorIcons,
    qrImg,
    manualColorIdentity,
  ]);

  const applyCardUpdate = useCallback(
    (updated: ShowcaseCard, role: CardRole) => {
      if (role.startsWith("commander-")) {
        const idx = parseInt(role.split("-")[1]);
        setCommanders((p) => p.map((c, i) => (i === idx ? updated : c)));
        loadImg(updated).then((img) =>
          setCommanderImgs((p) => p.map((c, i) => (i === idx ? img : c))),
        );
      } else {
        const idx = parseInt(role.split("-")[1]);
        setKeys((p) => p.map((c, i) => (i === idx ? updated : c)));
        loadImg(updated).then((img) =>
          setKeyImgs((p) => p.map((c, i) => (i === idx ? img : c))),
        );
      }
    },
    [loadImg],
  );

  const handleSelectPrinting = useCallback(
    (index: number) => {
      if (!modalCard || !modalRole) return;
      const { imageUrls, isDoubleFaced } = getPrintingImageUrls(
        modalCard.allPrintings[index],
      );
      const updated = {
        ...modalCard,
        selectedIndex: index,
        imageUrls,
        isDoubleFaced,
      };
      setModalCard(updated);
      applyCardUpdate(updated, modalRole);
    },
    [modalCard, modalRole, applyCardUpdate],
  );

  const handleUploadCustomImage = useCallback(
    (url: string, faceIndex?: number) => {
      if (!modalCard || !modalRole) return;
      let updated: ShowcaseCard;
      if (url === "") {
        const { imageUrls, isDoubleFaced } = getPrintingImageUrls(
          modalCard.allPrintings[modalCard.selectedIndex],
        );
        updated = {
          ...modalCard,
          customImageUrl: undefined,
          customImageUrls: undefined,
          imageUrls,
          isDoubleFaced,
        };
      } else if (faceIndex !== undefined) {
        const faces = modalCard.customImageUrls
          ? [...modalCard.customImageUrls]
          : ["", ""];
        faces[faceIndex] = url;
        updated = {
          ...modalCard,
          customImageUrls: faces,
          imageUrls: faces.filter(Boolean),
        };
      } else {
        updated = { ...modalCard, customImageUrl: url, imageUrls: [url] };
      }
      setModalCard(updated);
      applyCardUpdate(updated, modalRole);
    },
    [modalCard, modalRole, applyCardUpdate],
  );

  const handleSelectSuggestion = useCallback(
    (name: string) => {
      if (!suggestRole) return;
      setSuggestCard(null);
      setSuggestRole(null);
      if (suggestRole.startsWith("commander-")) {
        const idx = parseInt(suggestRole.split("-")[1]);
        setCommanderNames((n) => n.map((x, i) => (i === idx ? name : x)));
      } else {
        const idx = parseInt(suggestRole.split("-")[1]);
        setKeyNames((n) => n.map((x, i) => (i === idx ? name : x)));
      }
    },
    [suggestRole],
  );

  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data: ShowcaseExport = {
      version: 1,
      title,
      bracket,
      description,
      deckUrl,
      manualColorIdentity,
      showColorIcons,
      commanders: commanders.map((c, i) => ({
        name: commanderNames[i],
        scryfallId: c?.allPrintings[c.selectedIndex]?.id,
      })),
      keyCards: keys.map((c, i) => ({
        name: keyNames[i],
        scryfallId: c?.allPrintings[c.selectedIndex]?.id,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "deck-showcase"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const data: ShowcaseExport = JSON.parse(await file.text());

    setTitle(data.title ?? "");
    setBracket(data.bracket ?? "");
    setDescription(data.description ?? "");
    setDeckUrl(data.deckUrl ?? "");
    setManualColorIdentity(data.manualColorIdentity ?? null);
    setShowColorIcons(data.showColorIcons ?? true);

    const cmdEntries = data.commanders ?? [];
    const keyEntries = data.keyCards ?? [];

    setCommanderNames(cmdEntries.map((c) => c.name));
    setCommanders(cmdEntries.map(() => null));
    setCommanderImgs(cmdEntries.map(() => null));
    setKeyNames(keyEntries.map((c) => c.name));
    setKeys(keyEntries.map(() => null));
    setKeyImgs(keyEntries.map(() => null));

    // Prevent debounce effects from re-fetching what we're about to fetch
    prevCommanderNames.current = cmdEntries.map((c) => c.name);
    prevKeyNames.current = keyEntries.map((c) => c.name);

    const buildCard = async (
      entry: ShowcaseExport["commanders"][number],
    ): Promise<ShowcaseCard | null> => {
      if (!entry.name.trim()) return null;
      const printings = await fetchAllPrintings(entry.name.trim());
      if (printings.length === 0)
        return { ...emptyCard(entry.name), error: true };
      const selectedIndex = entry.scryfallId
        ? Math.max(0, printings.findIndex((p) => p.id === entry.scryfallId))
        : 0;
      const { imageUrls, isDoubleFaced } = getPrintingImageUrls(printings[selectedIndex]);
      return {
        quantity: 1,
        name: entry.name,
        allPrintings: printings,
        selectedIndex,
        imageUrls,
        isDoubleFaced,
        colorIdentity: printings[0].color_identity ?? [],
        loading: false,
        error: false,
      };
    };

    Promise.all([
      Promise.all(cmdEntries.map(buildCard)),
      Promise.all(keyEntries.map(buildCard)),
    ]).then(async ([cmdCards, keyCards]) => {
      setCommanders(cmdCards);
      setKeys(keyCards);
      const [cmdImgsLoaded, keyImgsLoaded] = await Promise.all([
        Promise.all(cmdCards.map(loadImg)),
        Promise.all(keyCards.map(loadImg)),
      ]);
      setCommanderImgs(cmdImgsLoaded);
      setKeyImgs(keyImgsLoaded);
    });
  };

  const handleDownload = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "deck-showcase"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const addCommander = () => {
    if (commanderNames.length >= 4) return;
    setCommanderNames((n) => [...n, ""]);
    setCommanders((c) => [...c, null]);
    setCommanderImgs((i) => [...i, null]);
  };
  const removeCommander = (idx: number) => {
    setCommanderNames((n) => n.filter((_, i) => i !== idx));
    setCommanders((c) => c.filter((_, i) => i !== idx));
    setCommanderImgs((i) => i.filter((_, j) => j !== idx));
  };

  const addKey = () => {
    if (keyNames.length >= 5) return;
    setKeyNames((n) => [...n, ""]);
    setKeys((c) => [...c, null]);
    setKeyImgs((i) => [...i, null]);
  };
  const removeKey = (idx: number) => {
    setKeyNames((n) => n.filter((_, i) => i !== idx));
    setKeys((c) => c.filter((_, i) => i !== idx));
    setKeyImgs((i) => i.filter((_, j) => j !== idx));
  };

  return (
    <div className="showcase-page">
      <h1 className="showcase-heading">Deck Showcase</h1>
      <div className="showcase-layout">
        <div className="showcase-preview">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="showcase-canvas"
          />
          <div className="showcase-preview-actions">
            <button className="showcase-download-btn" onClick={handleDownload}>
              Download PNG
            </button>
            <button className="showcase-export-btn" onClick={handleExport}>
              Export
            </button>
            <button
              className="showcase-import-btn"
              onClick={() => importRef.current?.click()}
            >
              Import
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </div>
        </div>

        <div className="showcase-form">
          <div className="showcase-field">
            <label>Title</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My EDH Deck"
              className="showcase-textarea"
              rows={2}
            />
          </div>

          <div className="showcase-section">
            <div className="showcase-section-header">
              <h3 className="showcase-section-title">Commanders</h3>
            </div>
            {commanderNames.map((name, i) => (
              <CardInputRow
                key={i}
                name={name}
                card={commanders[i] ?? null}
                onNameChange={(v) =>
                  setCommanderNames((n) => n.map((x, j) => (j === i ? v : x)))
                }
                onArtClick={() => {
                  const c = commanders[i];
                  if (c) {
                    setModalCard(c);
                    setModalRole(`commander-${i}`);
                  }
                }}
                onErrorClick={() => {
                  const c = commanders[i];
                  if (c) {
                    setSuggestCard(c);
                    setSuggestRole(`commander-${i}`);
                  }
                }}
                onRemove={
                  commanderNames.length > 1
                    ? () => removeCommander(i)
                    : undefined
                }
                placeholder={i === 0 ? "Main commander" : "Alt commander"}
              />
            ))}
            {commanderNames.length < 4 && (
              <button
                className="showcase-add-section-btn"
                onClick={addCommander}
              >
                + Commander
              </button>
            )}
          </div>

          <div className="showcase-field">
            <label>Colours</label>
            <div className="color-picker">
              {["W", "U", "B", "R", "G"].map((c) => {
                const effective =
                  manualColorIdentity ?? commanders[0]?.colorIdentity ?? [];
                const active = effective.includes(c);
                return (
                  <button
                    key={c}
                    className={`color-picker-btn ${active ? "active" : ""}`}
                    onClick={() => {
                      const base =
                        manualColorIdentity ??
                        commanders[0]?.colorIdentity ??
                        [];
                      const next = base.includes(c)
                        ? base.filter((x) => x !== c)
                        : [...base, c];
                      setManualColorIdentity(next);
                    }}
                  >
                    <img
                      src={`https://svgs.scryfall.io/card-symbols/${c}.svg`}
                      alt={c}
                      width={24}
                      height={24}
                    />
                  </button>
                );
              })}
              <label className="color-picker-toggle">
                <input
                  type="checkbox"
                  checked={showColorIcons}
                  onChange={(e) => setShowColorIcons(e.target.checked)}
                />
                Show icons
              </label>
            </div>
          </div>

          <div className="showcase-field showcase-field--bracket">
            <label>Bracket</label>
            <select
              value={bracket}
              onChange={(e) => setBracket(e.target.value)}
              className="showcase-input"
            >
              <option value="">None</option>
              <option value="Bracket 1 - Exhibition">
                Bracket 1 - Exhibition
              </option>
              <option value="Bracket 2 - Core">Bracket 2 - Core</option>
              <option value="Bracket 3 - Upgraded">Bracket 3 - Upgraded</option>
              <option value="Bracket 4 - Optimized">
                Bracket 4 - Optimized
              </option>
              <option value="Bracket 5 - cEDH">Bracket 5 - cEDH</option>
            </select>
          </div>

          <div className="showcase-section">
            <div className="showcase-section-header">
              <h3 className="showcase-section-title">Description</h3>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your deck..."
              className="showcase-textarea"
              rows={4}
            />
          </div>

          <div className="showcase-section showcase-section--card">
            <div className="showcase-section-header">
              <h3 className="showcase-section-title">Key Cards</h3>
            </div>
            {keyNames.map((name, i) => (
              <CardInputRow
                key={i}
                name={name}
                card={keys[i] ?? null}
                onNameChange={(v) =>
                  setKeyNames((n) => n.map((x, j) => (j === i ? v : x)))
                }
                onArtClick={() => {
                  const c = keys[i];
                  if (c) {
                    setModalCard(c);
                    setModalRole(`key-${i}`);
                  }
                }}
                onErrorClick={() => {
                  const c = keys[i];
                  if (c) {
                    setSuggestCard(c);
                    setSuggestRole(`key-${i}`);
                  }
                }}
                onRemove={() => removeKey(i)}
                placeholder="e.g. Doubling Season"
              />
            ))}
            {keyNames.length < 5 && (
              <button className="showcase-add-section-btn" onClick={addKey}>
                + Card
              </button>
            )}
          </div>

          <div className="showcase-section">
            <div className="showcase-section-header">
              <h3 className="showcase-section-title">Deck URL</h3>
            </div>
            <input
              type="text"
              value={deckUrl}
              onChange={(e) => setDeckUrl(e.target.value)}
              placeholder="https://moxfield.com/decks/..."
              className="showcase-input"
            />
          </div>
        </div>
      </div>

      {modalCard && modalRole && (
        <CardArtModal
          card={modalCard}
          onClose={() => {
            setModalCard(null);
            setModalRole(null);
          }}
          onSelectPrinting={handleSelectPrinting}
          onUploadCustomImage={handleUploadCustomImage}
        />
      )}

      {suggestCard && suggestRole && (
        <CardSuggestionsModal
          card={suggestCard}
          onClose={() => {
            setSuggestCard(null);
            setSuggestRole(null);
          }}
          onSelectSuggestion={handleSelectSuggestion}
        />
      )}
    </div>
  );
}
