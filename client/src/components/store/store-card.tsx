import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StoreWithProductCount } from "@/shared/types";

interface StoreCardProps {
  store: StoreWithProductCount;
}

const StoreCard = ({ store }: StoreCardProps) => {
  // Generate store initial letters for the logo placeholder
  const getStoreInitials = () => {
    if (!store.name) return "";
    
    const nameParts = store.name.split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Generate random color for store logo background (but deterministic based on store id)
  const getColorClass = () => {
    const colors = [
      "bg-primary", // blue
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500"
    ];
    
    // Use store id to determine color (or fallback to index 0)
    const colorIndex = store.id ? store.id % colors.length : 0;
    return colors[colorIndex];
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          {store.logo ? (
            <div className="flex-shrink-0 h-14 w-14 rounded-full overflow-hidden">
              <img src={store.logo} alt={store.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className={`flex-shrink-0 h-14 w-14 ${getColorClass()} rounded-full flex items-center justify-center`}>
              <span className="text-xl font-bold text-white">{getStoreInitials()}</span>
            </div>
          )}
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-sm text-gray-500">{store.productCount} products</span>
        </div>
        <div className="mt-4">
          <Link href={`/store/${store.id}`}>
            <Button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Visit Store
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
