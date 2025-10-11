// A dummy hook to simulate fetching client-specific theme settings.
// In a real application, this would fetch data from an API.
const useClientTheme = () => {
  return {
    data: {
      businessLogoHref:
        "https://dummyimage.com/150x50/e5e7eb/6b7280.png&text=Client+Logo", // A working placeholder logo
      themeColor: "#28a745", // A greenish primary color
      secondaryColor: "#218838", // A darker greenish secondary color
    },
    isFetching: false,
  };
};

export default useClientTheme;
