import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Heading, Hint, Input, Text, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import * as z from "zod";

import { Form } from "../../components/common/form";
import AvatarBox from "../../components/common/logo-box/avatar-box";
import { useSignInWithEmailPass } from "../../hooks/api";
import { isFetchError } from "../../lib/is-fetch-error";
import { queryClient } from "../../lib/query-client";
import { useExtension } from "../../providers/extension-provider";
import { encryptObject } from "../../utils/encryption";

export interface EncryptedSignUpPayload {
  email: string;
  password: string;
}

const LoginSchema = z
  .object({
    email: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If both are missing, add a single, combined error
    if (!data.email && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email and password are required",
        path: ["email"],
      });
    }

    // If only email is missing, add its specific error
    else if (!data.email && data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required",
        path: ["email"],
      });
    }

    // If only password is missing, add its specific error
    else if (data.email && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required",
        path: ["password"],
      });
    }
  });

export const Login = () => {
  const { t } = useTranslation();
  const { getWidgets } = useExtension();

  const from = "/access";

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync, isPending } = useSignInWithEmailPass();

  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    const encryptedData = await encryptObject({
      email,
      password,
    });

    try {
      const response = await mutateAsync(encryptedData as EncryptedSignUpPayload, {
        onError: (error: any) => {
          if (isFetchError(error)) {
            if (error.status === 401) {
              form.setError("email", {
                type: "manual",
                message: error.message,
              });
              return;
            } else if (error.status === 403) {
              const errorData = error.response?.data;
              if (errorData?.code === "account_suspended") {
                toast.error("Account Suspended", {
                  description:
                    errorData.message ||
                    "This account has been suspended. Please contact support for assistance.",
                  duration: 10000, // Increased duration
                });
                return;
              } else if (errorData?.code === "inactive_user") {
                toast.error("Account Inactive", {
                  description:
                    errorData.message ||
                    "This account is inactive. Please contact support for assistance.",
                  duration: 10000,
                });
                return;
              }
            }
          }

          // Show error in toast and form
          toast.error("Login Failed", {
            description: error.message || "An error occurred during login",
            duration: 10000,
          });

          form.setError("root.serverError", {
            type: "manual",
            message: error.message,
          });
        },
        onSuccess: () => {
          // Clear cache and force page reload to ensure fresh session
          queryClient.clear();
          const baseUrl = __BASE__ === "/" ? "" : __BASE__;
          const targetPath = from.startsWith("/") ? from : `/${from}`;
          window.location.href = `${baseUrl}${targetPath}`;
        },
      });
    } catch (error: any) {
      // Handle fetch errors (network issues, etc.)
      if (error?.response?.status === 403) {
        const errorCode = error?.response?.data?.code;

        if (errorCode === "account_suspended") {
          toast.error("Account Suspended", {
            description:
              error.response.data.message ||
              "This account has been suspended. Please contact support for assistance.",
            duration: 10000,
          });
          return;
        } else if (errorCode === "inactive_user") {
          toast.error("Account Inactive", {
            description:
              error.response.data.message ||
              "Your account is inactive. Please contact support for assistance.",
            duration: 10000,
          });
          return;
        }
      }

      // Handle other errors
      const errorMessage =
        error.response?.data?.message || error.message || "An unknown error occurred";
      toast.error("Login Failed", {
        description: errorMessage,
        duration: 10000,
      });

      form.setError("root.serverError", {
        type: "manual",
        message: errorMessage,
      });
    }
  });

  const serverError = form.formState.errors?.root?.serverError?.message;
  const validationError =
    form.formState.errors.email?.message || form.formState.errors.password?.message;

  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center">
      <div className="m-4 flex w-full max-w-[280px] flex-col items-center">
        <AvatarBox />
        <div className="mb-4 flex flex-col items-center">
          <Heading>{t("login.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle text-center">
            {t("login.hint")}
          </Text>
        </div>
        <div className="flex w-full flex-col gap-y-3">
          {getWidgets("login.before").map((Component, i) => {
            return <Component key={i} />;
          })}
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
              <div className="flex flex-col gap-y-1">
                <Form.Field
                  control={form.control}
                  name="email"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            autoComplete="email"
                            {...field}
                            className="bg-ui-bg-field-component"
                            placeholder={t("fields.email")}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="password"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{}</Form.Label>
                        <Form.Control>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                            className="bg-ui-bg-field-component"
                            placeholder={t("fields.password")}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
              </div>
              {validationError && (
                <div className="text-center">
                  <Hint className="inline-flex" variant={"error"}>
                    {validationError}
                  </Hint>
                </div>
              )}
              {serverError && (
                <Alert className="bg-ui-bg-base items-center p-2" dismissible variant="error">
                  {serverError}
                </Alert>
              )}
              <Button className="w-full" type="submit" isLoading={isPending}>
                {t("actions.continueWithEmail")}
              </Button>
            </form>
          </Form>
          {getWidgets("login.after").map((Component, i) => {
            return <Component key={i} />;
          })}
        </div>
        <span className="text-ui-fg-muted txt-small my-6">
          <Trans
            i18nKey="login.forgotPassword"
            components={[
              <Link
                key="reset-password-link"
                to="/reset-password"
                className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
              />,
            ]}
          />
        </span>
      </div>
    </div>
  );
};
