import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "../../../components/modals";
import { useUser } from "../../../hooks/api/users";
import { EditUserForm } from "./components/edit-user-form";
import { decryptObject } from "../../../utils/encryption";
import { useState, useEffect } from "react";
import { HttpTypes } from "@medusajs/types";

export const UserEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, isPending: isLoading, isError, error } = useUser(id!);

  if (isError) {
    throw error;
  }

  const [decryptedUser, setDecryptedUser] = useState<HttpTypes.AdminUser | null>(null);

  useEffect(() => {
    if (user) {
      decryptObject(user).then(result => {
        setDecryptedUser(result as HttpTypes.AdminUser);
      });
    }
  }, [user]);

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("users.editUser")}</Heading>
      </RouteDrawer.Header>
      {!isLoading && decryptedUser && <EditUserForm user={decryptedUser} />}
    </RouteDrawer>
  );
};
