export const handler = async () => {
  return [
    {
      id: "abc-123",
      title: "The Hitchhiker's Guide to the Galaxy",
      completed: true,
      rating: 10,
      reviews: ["This book is awesome!"],
    },
    {
      id: "def-456",
      title: "The Restaurant at the End of the Universe",
      completed: false,
      rating: 2,
      reviews: ["This book is terrible!"],
    },
  ];
};
