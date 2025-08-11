export const mockData = {
  players: [
    {
      id: 1,
      name: "Alex",
      chips: 15000,
      bet: 100,
      cards: [
        { rank: "A", suit: "spades" },
        { rank: "K", suit: "hearts" }
      ],
      avatar: null,
      folded: false,
      showCards: false
    },
    {
      id: 2,
      name: "Sarah",
      chips: 22500,
      bet: 100,
      cards: [
        { rank: "Q", suit: "diamonds" },
        { rank: "J", suit: "clubs" }
      ],
      avatar: null,
      folded: false,
      showCards: false
    },
    {
      id: 3,
      name: "Mike",
      chips: 8750,
      bet: 100,
      cards: [
        { rank: "10", suit: "hearts" },
        { rank: "9", suit: "spades" }
      ],
      avatar: null,
      folded: false,
      showCards: false
    },
    {
      id: 4,
      name: "Emma",
      chips: 19200,
      bet: 100,
      cards: [
        { rank: "K", suit: "clubs" },
        { rank: "Q", suit: "hearts" }
      ],
      avatar: null,
      folded: false,
      showCards: false
    },
    {
      id: 5,
      name: "David",
      chips: 12800,
      bet: 100,
      cards: [
        { rank: "7", suit: "diamonds" },
        { rank: "7", suit: "clubs" }
      ],
      avatar: null,
      folded: false,
      showCards: false
    },
    {
      id: 6,
      name: "Lisa",
      chips: 25600,
      bet: 100,
      cards: [
        { rank: "A", suit: "diamonds" },
        { rank: "2", suit: "spades" }
      ],
      avatar: null,
      folded: false,
      showCards: false
    }
  ],

  communityCards: [
    { rank: "A", suit: "clubs" },
    { rank: "K", suit: "diamonds" },
    { rank: "Q", suit: "spades" },
    { rank: "J", suit: "hearts" },
    { rank: "10", suit: "diamonds" }
  ],

  chatMessages: [
    {
      id: 1,
      player: "Alex",
      message: "Good luck everyone!",
      timestamp: "10:23 AM"
    },
    {
      id: 2,
      player: "Sarah",
      message: "Let's play some poker! 🃏",
      timestamp: "10:24 AM"
    },
    {
      id: 3,
      player: "Mike",
      message: "I'm feeling lucky today",
      timestamp: "10:25 AM"
    },
    {
      id: 4,
      player: "Emma",
      message: "Nice hand setup!",
      timestamp: "10:26 AM"
    }
  ],

  initialGameState: {
    gameId: "game_123",
    phase: "preflop",
    pot: 600,
    currentBet: 100,
    dealer: 0,
    smallBlind: 1,
    bigBlind: 2,
    activePlayer: 3
  }
};