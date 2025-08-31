"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PhonePreview } from "@/app/(dashboard)/store/components/PhonePreview";
import { LeadMagnetContext } from "./context";

// Prevent static generation for this layout
export const dynamic = 'force-dynamic';

// Import FormField type from context
interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea";
  required: boolean;
  placeholder: string;
}

interface WizardLayoutProps {
  children: React.ReactNode;
}

export default function WizardLayout({ children }: WizardLayoutProps) {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;
  const editProductId = searchParams.get("edit");

  // Default form fields - memoize to prevent recreation
  const defaultFields = useMemo((): FormField[] => [
    {
      id: "name_field",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Your Name"
    },
    {
      id: "email_field", 
      label: "Email",
      type: "email",
      required: true,
      placeholder: "Your Email"
    }
  ], []);

  // Lead magnet data state in layout
  const [leadMagnetData, setLeadMagnetData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaText: "Get Free Resource",
    downloadUrl: "",
    formFields: defaultFields
  });

  // Get store data by slug (storeId from URL is actually the slug)
  const store = useQuery(
    api.stores.getStoreBySlug,
    storeId ? { slug: storeId } : "skip"
  );

  // Fetch existing products to load saved lead magnet data
  const existingProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    store?._id ? { storeId: store._id } : "skip"
  );

  // Fetch specific product if in edit mode
  const editProduct = useQuery(
    api.digitalProducts.getProductById,
    editProductId ? { productId: editProductId as any } : "skip"
  );

  // Load existing lead magnet data on mount
  useEffect(() => {
    // If in edit mode, load the specific product
    if (editProductId && editProduct) {
      setLeadMagnetData({
        title: editProduct.title || "",
        subtitle: editProduct.description || "",
        imageUrl: editProduct.imageUrl || "",
        ctaText: editProduct.buttonLabel || "Get Free Resource",
        downloadUrl: editProduct.downloadUrl || "",
        formFields: defaultFields
      });
      return;
    }

    // Otherwise, load the most recent lead magnet for create mode
    if (existingProducts && existingProducts.length > 0) {
      // Find lead magnets (typically price: 0 and style: "card")
      const leadMagnets = existingProducts.filter(product => 
        product.price === 0 && product.style === "card"
      );
      
      if (leadMagnets.length > 0) {
        // Load the most recent lead magnet
        const latestLeadMagnet = leadMagnets.sort((a, b) => b._creationTime - a._creationTime)[0];
        
        setLeadMagnetData({
          title: latestLeadMagnet.title || "",
          subtitle: latestLeadMagnet.description || "",
          imageUrl: latestLeadMagnet.imageUrl || "",
          ctaText: latestLeadMagnet.buttonLabel || "Get Free Resource",
          downloadUrl: latestLeadMagnet.downloadUrl || "",
          formFields: defaultFields // For now, always use defaults (can be enhanced later to save/load custom fields)
        });
      }
    }
  }, [editProductId, editProduct, existingProducts, defaultFields]);

  // Memoize the update function to prevent infinite loops
  const updateLeadMagnetData = useCallback((data: Partial<typeof leadMagnetData>) => {
    console.log("🔄 Context updating leadMagnetData:", data);
    setLeadMagnetData(prev => {
      const newData = { ...prev, ...data };
      console.log("📦 New leadMagnetData:", newData);
      return newData;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    leadMagnetData,
    updateLeadMagnetData
  }), [leadMagnetData, updateLeadMagnetData]);

  // Always wrap children in context provider
  return (
    <LeadMagnetContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 lg:flex lg:gap-20">
        <div className="flex-1 space-y-10">{children}</div>
        {!user ? (
          <div className="w-[356px] h-[678px] bg-gray-200 rounded-3xl animate-pulse" />
        ) : (
          <PhonePreview 
            user={user}
            store={store || undefined}
            mode="leadMagnet"
            leadMagnet={leadMagnetData}
          />
        )}
      </div>
    </LeadMagnetContext.Provider>
  );
} 