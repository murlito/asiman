export const mockData = {
  players: [
    {
      id: 1,
      name: "Player 1",
      chips: 1000,
      bet: 0,
      cards: [
        { rank: "A", suit: "spades" },
        { rank: "K", suit: "hearts" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 0 // Bottom center - current player
    },
    {
      id: 2,
      name: "Player 2", 
      chips: 900,
      bet: 0,
      cards: [
        { rank: "Q", suit: "diamonds" },
        { rank: "J", suit: "clubs" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 1 // Bottom left
    },
    {
      id: 3,
      name: "Player 3",
      chips: 1100,
      bet: 0,
      cards: [
        { rank: "10", suit: "hearts" },
        { rank: "9", suit: "spades" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 2 // Left side
    },
    {
      id: 4,
      name: "Player 4",
      chips: 950,
      bet: 0,
      cards: [
        { rank: "K", suit: "clubs" },
        { rank: "Q", suit: "hearts" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 3 // Top left
    },
    {
      id: 5,
      name: "Player 5",
      chips: 1200,
      bet: 0,
      cards: [
        { rank: "7", suit: "diamonds" },
        { rank: "7", suit: "clubs" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 4 // Top center-left
    },
    {
      id: 6,
      name: "Player 6",
      chips: 800,
      bet: 0,
      cards: [
        { rank: "A", suit: "diamonds" },
        { rank: "2", suit: "spades" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 5 // Top center-right
    },
    {
      id: 7,
      name: "Player 7",
      chips: 1300,
      bet: 0,
      cards: [
        { rank: "J", suit: "hearts" },
        { rank: "10", suit: "diamonds" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 6 // Right side
    },
    {
      id: 8,
      name: "CKY",
      chips: 1000,
      bet: 0,
      cards: [
        { rank: "8", suit: "clubs" },
        { rank: "8", suit: "hearts" }
      ],
      avatar: null,
      folded: false,
      showCards: false,
      position: 7 // Bottom right
    }
  ],

  currentPlayerHand: [
    { rank: "J", suit: "spades" },
    { rank: "4", suit: "spades" }
  ],

  communityCards: [
    { rank: "A", suit: "clubs" },
    { rank: "K", suit: "diamonds" },
    { rank: "Q", suit: "spades" },
    { rank: "J", suit: "hearts" },
    { rank: "10", suit: "diamonds" }
  ],

  gameInfo: {
    pot: 30,
    blinds: { small: 10, big: 20 },
    currentBet: 20,
    phase: "preflop"
  }
};