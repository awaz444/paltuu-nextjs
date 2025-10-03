import React from 'react';

interface Props {
  product: any;
}

const BazaarProductCard: React.FC<Props> = ({ product }) => {
  const image = product.images && product.images[0] ? product.images[0] : '/default-avatar.png';

  return (
    <div className="bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300">
      <div className="relative">
        <img src={image} alt={product.title} className="w-full aspect-square object-cover rounded-2xl" />
        {Number(product.price) > 0 && (
          <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2 py-1 rounded-full">
            PKR {Math.floor(Number(product.price))}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-2xl mb-1 truncate max-w-[90%]">{product.title}</h3>
        {/* <p className="text-gray-600 mb-1 truncate max-w-[90%]">{product.short_description}</p> */}
      </div>
    </div>
  );
};

export default BazaarProductCard;
