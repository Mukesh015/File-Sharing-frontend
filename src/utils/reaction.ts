export const REACTIONS = [
    { id: "like", emoji: "👍" },
    { id: "love", emoji: "❤️" },
    { id: "laugh", emoji: "😂" },
    { id: "wow", emoji: "😮" },
    { id: "sad", emoji: "😢" },
    { id: "angry", emoji: "😡" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["id"];