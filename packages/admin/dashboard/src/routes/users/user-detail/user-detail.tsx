import { useLoaderData, useParams } from "react-router-dom";

import { useUser } from "../../../hooks/api/users";
import { UserGeneralSection } from "./components/user-general-section";
import { userLoader } from "./loader";

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { SingleColumnPage } from "../../../components/layout/pages";
import { useExtension } from "../../../providers/extension-provider";
import { decryptObject } from "../../../utils/encryption";
import { useState, useEffect } from "react";
import { HttpTypes } from "@medusajs/types";

export const UserDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof userLoader>>;

  const { id } = useParams();
  const {
    user,
    isPending: isLoading,
    isError,
    error,
  } = useUser(id!, undefined, {
    initialData,
  });

  const [decryptedUser, setDecryptedUser] = useState<HttpTypes.AdminUser | null>(null);

  useEffect(() => {
    if (user) {
      decryptObject(user).then(result => {
        setDecryptedUser(result as HttpTypes.AdminUser);
      });
    }
  }, [user]);

  const { getWidgets } = useExtension();

  if (isLoading || !decryptedUser) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage
      data={decryptedUser}
      showJSON
      showMetadata
      widgets={{
        after: getWidgets("user.details.after"),
        before: getWidgets("user.details.before"),
      }}
    >
      <UserGeneralSection user={decryptedUser} />
    </SingleColumnPage>
  );
};
