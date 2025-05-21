export interface ShippingLabelData {
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  shippingAddress: string;
  barcode: string;
}

interface ShippingLabelProps {
  data: ShippingLabelData;
}

function Barcode({ value }: { value: string }) {
  // Simple barcode SVG generator (Code 128-like, not for production)
  // For real barcodes, use a library like bwip-js or jsbarcode
  function getBars(val: string) {
    // Map chars to bar patterns (very simplified)
    return val.split('').map((char, i) => {
      const code = char.charCodeAt(0);
      const width = 2 + (code % 3); // 2-4px
      const height = 40;
      const x = i * 5;
      return (
        <rect
          key={i}
          x={x}
          y={0}
          width={width}
          height={height}
          fill={i % 2 === 0 ? "#222" : "#888"}
          rx={width / 3}
        />
      );
    });
  }
  return (
    <div className="flex flex-col items-center">
      <svg width={value.length * 5} height={40} className="mb-1">
        {getBars(value.replace(/[^A-Za-z0-9]/g, ""))}
      </svg>
      <span className="text-xs tracking-widest font-mono">{value}</span>
    </div>
  );
}

export function ShippingLabel({ data }: ShippingLabelProps) {
  return (
    <div className="w-[350px] mx-auto bg-white text-black rounded-lg shadow-lg border p-6 print:p-0 print:shadow-none print:border-none print:bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold tracking-wide">Shipping Label</div>
        {/* Barcode SVG */}
        <Barcode value={data.barcode} />
      </div>
      <div className="mb-3">
        <div className="font-semibold text-sm text-gray-700">From (Seller):</div>
        <div className="text-sm">{data.sellerName}</div>
        <div className="text-xs text-gray-500">{data.sellerEmail}</div>
      </div>
      <div className="mb-3">
        <div className="font-semibold text-sm text-gray-700">To (Buyer):</div>
        <div className="text-sm">{data.buyerName}</div>
        <div className="text-xs text-gray-500">{data.buyerEmail}</div>
      </div>
      <div className="mb-3">
        <div className="font-semibold text-sm text-gray-700">Shipping Address:</div>
        <div className="text-sm">{data.shippingAddress}</div>
      </div>
      <div className="mt-4 border-t pt-2 text-xs text-gray-500">
        Please handle with care. Thank you for using ReMarket!
      </div>
    </div>
  );
}