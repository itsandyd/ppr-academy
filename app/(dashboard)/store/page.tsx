"use client";

import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { ProfileCard } from "./components/ProfileCard";
import { AddProductBar } from "./components/AddProductBar";
import { PhonePreview } from "./components/PhonePreview";
import { ProductsList } from "./components/ProductsList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@clerk/nextjs";
import React, { useEffect } from "react";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

function StoreContent() {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const createUser = useMutation(api.users.createUser);

  // Fetch user from Convex database using Clerk ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Create user in Convex if they don't exist
  useEffect(() => {
    async function createUserIfNeeded() {
      if (!clerkUser || !userLoaded || !isAuthenticated || convexUser !== null) return;
      
      // If user is loaded but not found in Convex, create them
      if (convexUser === null && clerkUser.primaryEmailAddress?.emailAddress) {
        console.log("Creating user in Convex...", clerkUser.id);
        try {
          await createUser({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress.emailAddress,
            firstName: clerkUser.firstName || undefined,
            lastName: clerkUser.lastName || undefined,
            imageUrl: clerkUser.imageUrl || undefined,
            name: clerkUser.firstName && clerkUser.lastName 
              ? `${clerkUser.firstName} ${clerkUser.lastName}` 
              : clerkUser.firstName || clerkUser.lastName || undefined
          });
          console.log("User created in Convex");
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    }

    createUserIfNeeded();
  }, [clerkUser, userLoaded, isAuthenticated, convexUser, createUser]);

  // Fetch stores for the current user
  const stores = useQuery(
    api.stores.getStoresByUser, 
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );

  // Get the first store (or you could let user select which store)
  const currentStore = stores?.[0];

  // Fetch products for the current store
  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    currentStore?._id ? { storeId: currentStore._id } : "skip"
  );

  // Fetch courses for the current store (using Convex)
  const courses = useQuery(
    api.courses.getCoursesByStore,
    currentStore?._id ? { storeId: currentStore._id } : "skip"
  );

  // Debug: Fetch ALL courses to see if any exist (temporary for debugging)
  const allCourses = useQuery(api.courses.getCourses, {});

  // Debug logging (temporary for debugging)
  console.log("🔍 Store Debug Info:");
  console.log("📱 Clerk User ID:", clerkUser?.id);
  console.log("🏪 Current Store ID:", currentStore?._id);
  console.log("📚 Store Courses from Convex:", courses);
  console.log("🌍 ALL Courses from Convex:", allCourses);
  console.log("🛍️ Digital Products from Convex:", digitalProducts);

  // Combine and transform courses and digital products into unified format
  const products = React.useMemo(() => {
    const transformedCourses = (courses || []).map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      imageUrl: course.imageUrl,
      isPublished: course.isPublished,
      style: undefined, // Courses don't have style
      slug: course.slug
    }));

    const allProducts = [
      ...(digitalProducts || []),
      ...transformedCourses
    ];

    return allProducts;
  }, [digitalProducts, courses]);

  // Show loading state while data is being fetched
  if (!userLoaded || !clerkUser || courses === undefined || digitalProducts === undefined) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 py-10 md:py-16">
        <div className="flex-1 flex flex-col gap-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="w-[356px] h-[678px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 py-10 md:py-16">
      {/* LEFT COLUMN */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-3xl font-bold">
            {currentStore?.name || "My Store"}
          </h1>
          <span className="text-sm text-muted-foreground">
            pauseplayrepeat.com/{currentStore?.slug || currentStore?.name || "user"}
          </span>
        </div>
        
        <ModeSwitcher storeId={currentStore?._id} />
        
        <ProfileCard 
          user={clerkUser}
          store={currentStore}
        />
        
        <AddProductBar 
          storeId={currentStore?._id}
          userId={clerkUser.id}
        />

        {/* Products List */}
        <ProductsList 
          products={products}
          storeId={currentStore?._id}
        />
        
                          <Button variant="link" className="text-primary text-sm mt-4 hover:underline p-0 h-auto">
          Add Section
        </Button>
      </div>

      {/* RIGHT COLUMN */}
      <PhonePreview 
        user={clerkUser}
        products={products}
        store={currentStore}
      />
    </div>
  );
}

export default function MyStorePage() {
  return (
    <>
      <Authenticated>
        <StoreContent />
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to PPR Academy Store</h1>
            <p className="text-gray-600 mb-8">Please sign in to access your store dashboard</p>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Sign In to Continue
              </Button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
} 