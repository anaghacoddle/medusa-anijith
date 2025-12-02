import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

import { SingleColumnPage } from "../../../components/layout/pages";
import { useExtension } from "../../../providers/extension-provider";
import { CartGeneralSection, CartItemsSection } from "./components";

interface CartDetailsResponse {
  cart: any;
  customer_id: string | null;
  metadata: any;
}

// Updated function to use the comprehensive cart-details API
const getCartDetails = async (cartId: string): Promise<CartDetailsResponse> => {
  console.log("Fetching comprehensive cart details for cart ID:", cartId);

  try {
    // Use the new comprehensive cart-details endpoint
    const response = await fetch(`/admin/carts/cart-details/${cartId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Cart not found with ID: ${cartId}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Comprehensive cart data received:", data);

    return {
      cart: data.cart,
      customer_id: data.customer_id,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("Error fetching cart details:", error);
    throw error;
  }
};

export const cartLoader = async ({ params }: LoaderFunctionArgs) => {
  const cartId = params.id!; // This is the cart_id from URL

  try {
    const result = await getCartDetails(cartId);
    return result;
  } catch (error) {
    console.error("Cart loader error:", error);
    // Return null to show error state in component
    return { cart: null, customer_id: null, metadata: null };
  }
};

export const CartDetail = () => {
  const { cart, customer_id, metadata } = useLoaderData() as CartDetailsResponse;
  const { getWidgets } = useExtension();

  console.log("Cart in component:", cart);
  console.log("Customer ID extracted:", customer_id);
  console.log("Metadata:", metadata);

  if (!cart) {
    return (
      <SingleColumnPage
        showJSON={false}
        showMetadata={false}
        data={null}
        widgets={{
          after: getWidgets("order.details.after"),
          before: getWidgets("order.details.before"),
        }}
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cart Not Found</h3>
            <p className="text-gray-500">
              The requested cart could not be found or has been deleted.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Cart ID: {window.location.pathname.split("/").pop()}
            </p>
          </div>
        </div>
      </SingleColumnPage>
    );
  }

  return (
    <SingleColumnPage
      showJSON
      showMetadata={false}
      data={cart}
      widgets={{
        after: getWidgets("order.details.after"),
        before: getWidgets("order.details.before"),
      }}
    >
      <CartGeneralSection cart={cart} />
      <CartItemsSection cart={cart} />

      {/* Display cart summary if available */}
      {/* {cart.summary && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Cart Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Items: {cart.summary.total_items}</div>
            <div>Quantity: {cart.summary.total_quantity}</div>
            <div>Subtotal: {cart.summary.subtotal}</div>
            <div>Status: {cart.summary.is_completed ? 'Completed' : 'Active'}</div>
          </div>
        </div>
      )} */}
    </SingleColumnPage>
  );
};

export const Component = CartDetail;

export const Breadcrumb = ({ cart }: { cart: any }) => cart?.id?.slice(0, 8) || "";

export const loader = cartLoader;
