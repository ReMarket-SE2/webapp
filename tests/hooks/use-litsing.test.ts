import { renderHook, act, waitFor } from "@testing-library/react";
import { useListings } from "@/lib/hooks/use-listings";
import * as actions from "@/lib/listings/actions";

// Mocks
jest.mock("@/lib/listings/actions", () => ({
  getAllListings: jest.fn(),
}));

const mockListings = [
  { id: 1, title: "Listing 1", price: "100", category: "Category 1", photo: "/image1.jpg" },
  { id: 2, title: "Listing 2", price: "200", category: "Category 2", photo: "/image2.jpg" },
];

describe("useListings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize with default values", () => {
    const { result } = renderHook(() => useListings());

    expect(result.current.listings).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.options).toEqual({});
  });

  test("should fetch and set listings on mount", async () => {
    jest.spyOn(actions, "getAllListings").mockResolvedValue(mockListings);

    const { result } = renderHook(() => useListings());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.listings).toEqual(mockListings);
  });

  test("should update options and fetch new listings", async () => {
    jest.spyOn(actions, "getAllListings").mockResolvedValue(mockListings);

    const { result } = renderHook(() => useListings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateOptions({ page: 2 });
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options.page).toBe(2);
    expect(result.current.listings).toEqual(mockListings);
  });

  test("should handle errors during fetching", async () => {
    jest.spyOn(actions, "getAllListings").mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => useListings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.listings).toEqual([]);
  });

  test("should handle empty response from API", async () => {
    jest.spyOn(actions, "getAllListings").mockResolvedValue([]);

    const { result } = renderHook(() => useListings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.listings).toEqual([]);
  });

  test("should update options without overwriting existing ones", () => {
    const { result } = renderHook(() => useListings({ page: 1, pageSize: 10 }));

    act(() => {
      result.current.updateOptions({ sortBy: "price" });
    });

    expect(result.current.options).toEqual({ page: 1, pageSize: 10, sortBy: "price" });
  });

  test("should handle invalid options gracefully", () => {
    const { result } = renderHook(() => useListings());

    act(() => {
      result.current.updateOptions({ page: -1 });
    });

    expect(result.current.options.page).toBe(-1);
  });
});

