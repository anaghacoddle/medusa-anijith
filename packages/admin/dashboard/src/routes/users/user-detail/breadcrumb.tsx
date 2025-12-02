import { HttpTypes } from "@medusajs/types";
import { UIMatch } from "react-router-dom";
import { useUser } from "../../../hooks/api/users";
import { decryptObject } from "../../../utils/encryption";
import { useState, useEffect } from "react";

type UserDetailBreadcrumbProps = UIMatch<HttpTypes.AdminUserResponse>;

export const UserDetailBreadcrumb = (props: UserDetailBreadcrumbProps) => {
  const { id } = props.params || {};
  // const id = props.params?.id;
  const [decryptedUser, setDecryptedUser] = useState<HttpTypes.AdminUser | null>(null);

  const { user } = useUser(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (user) {
      decryptObject(user).then(result => {
        setDecryptedUser(result as HttpTypes.AdminUser);
      });
    }
  }, [user]);

  if (!decryptedUser) {
    return null;
  }

  const name = [decryptedUser.first_name, decryptedUser.last_name].filter(Boolean).join(" ");

  const display = name || decryptedUser.email;

  return <span>{display}</span>;
};
