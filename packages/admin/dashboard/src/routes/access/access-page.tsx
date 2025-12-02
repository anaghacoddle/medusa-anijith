import { ChatBubbleLeftRight } from "@medusajs/icons";

// Define route config helper locally
const defineRouteConfig = (config: any) => config;
import { Container, Heading, Input, Button, Text } from "@medusajs/ui";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
const AccessPage = () => {
  const [passcode, setPasscode] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [showResetInfo, setShowResetInfo] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const didFetchRef = useRef(false);
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);
  const fetchQrCode = async (retryCount = 0) => {
    if (isFetchingRef.current) {
      console.log("🚫 Already fetching QR code, skipping...");
      return;
    }

    isFetchingRef.current = true;
    try {
      setIsGeneratingQR(true);
      const response = await fetch("/admin/generate-qr", {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch QR code: ${response.status}`);
      }

      const data = await response.json();

      if (data.hasExistingSecret) {
        setQrCodeUrl(null);
        return;
      }

      // setQrCodeUrl(data.qrCodeImageUrl)
      if (data.qrCodeImageUrl.startsWith("data:image")) {
        setQrCodeUrl(data.qrCodeImageUrl);
      } else {
        setQrCodeUrl(`${data.qrCodeImageUrl}?t=${Date.now()}`);
      }

      setError("");
    } catch (err) {
      console.error("Error fetching QR code:", err);
      if (retryCount < 2) {
        setTimeout(() => fetchQrCode(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        //setError("Failed to load QR code. Please refresh the page.");
        navigate("/login");
      }
    } finally {
      setIsGeneratingQR(false);
      isFetchingRef.current = false; // ← THIS is missing
    }
  };

  useEffect(() => {
    // if (didFetchRef.current) return
    if (didFetchRef.current || qrCodeUrl) return;
    didFetchRef.current = true;
    fetchQrCode();

    const timer = setTimeout(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        [role="dialog"] {
          display: none !important;
        }
        #medusa > div > div > div:nth-child(2) > div,
        #medusa > div > div > div.flex.h-screen.w-full.flex-col.overflow-auto > div {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }, 1);

    return () => clearTimeout(timer);
  });

  useEffect(() => {
    if (isVerified) {
      setTimeout(() => navigate("/orders"), 2000);
    }
  }, [isVerified, navigate]);

  const verifyMfaAndUnlockAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const mfaResponse = await fetch("/admin/verify-mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ passcode }),
      });

      const mfaData = await mfaResponse.json();
      console.log("MFA Response:", mfaData);

      if (!mfaResponse.ok) {
        switch (mfaData.error) {
          case "NO_SESSION":
            setError("Session expired. Please refresh the page and try again.");
            break;
          case "NO_MFA_SECRET":
            setError(
              "MFA setup expired. Please refresh the page to generate a new QR code.",
            );
            setTimeout(() => {
              fetchQrCode();
            }, 2000);
            break;
          case "MISSING_PASSCODE":
            setError("Please enter a passcode.");
            break;
          case "INVALID_PASSCODE_FORMAT":
            setError("Passcode must be exactly 6 digits.");
            break;
          case "MISSING_BODY":
            setError("Request error. Please try again.");
            break;
          default:
            setError("Access code verification failed.");
        }
        setIsLoading(false);
        return;
      }

      //setIsVerified(true)
      setIsVerified(true);
      sessionStorage.setItem("admin_verified", "true");
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please check your connection and try again.");
    }

    setIsLoading(false);
  };

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPasscode(value);
    if (error) setError("");
  };

  const handleRefreshQR = () => {
    // setQrCodeUrl(null);
    fetchQrCode();
  };

  if (isVerified) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <div className="text-center space-y-4">
            <div className="text-green-600 text-6xl">✓</div>
            <Heading level="h2" className="text-green-600">
              Access Granted!
            </Heading>
            <Text className="text-gray-600">
              You now have full access to the admin panel. Redirecting...
            </Text>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Access Verification Required</Heading>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="space-y-6">
            {qrCodeUrl ? (
              <div className="text-center relative">
                <Text className="mb-2 font-medium">
                  Scan this QR code to set up MFA
                </Text>
                <img
                  src={qrCodeUrl}
                  alt="MFA QR Code"
                  className="mx-auto max-w-[200px] border p-2 rounded-lg shadow"
                  style={{ opacity: isGeneratingQR ? 0.5 : 1 }}
                />
                {isGeneratingQR && (
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  </div>
                )}
                <Text className="text-xs text-gray-500 mt-2">
                  Microsoft Authenticator App Recommended
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleRefreshQR}
                  className="mt-2"
                >
                  Refresh QR Code
                </Button>
              </div>
            ) : isGeneratingQR ? (
              <div className="text-center">
                <Text className="mb-2">Generating QR code...</Text>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Text className="text-text-gray-600 mb-2">
                  Enter The Access Code
                </Text>
              </div>
            )}

            <div className="text-center space-y-2">
              <Text className="text-gray-600">
                Enter your 6-digit access code to unlock admin privileges
              </Text>
            </div>

            <form onSubmit={verifyMfaAndUnlockAccess} className="space-y-4">
              <div>
                <label
                  htmlFor="passcode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Access Code
                </label>
                <Input
                  id="passcode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={passcode}
                  onChange={handlePasscodeChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full text-center text-lg tracking-widest"
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || passcode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Unlock Access"}
              </Button>
            </form>
            <div className="text-center mt-4">
              <Button
                variant="secondary"
                type="button"
                className="bg-gray-800 text-white hover:bg-gray-700 rounded-md px-4 py-2 text-sm transition"
                onClick={() => setShowResetInfo((prev) => !prev)}
              >
                Need to reset your access code?{" "}
                <span className="ml-2">{showResetInfo ? "▴" : "▾"}</span>
              </Button>

              {showResetInfo && (
                <div className="mt-3 mx-auto max-w-md bg-gray-900 text-white border border-gray-700 rounded-md p-4 text-left text-sm">
                  <p className="mb-1">
                    <strong>To reset your QR code, please contact: </strong>
                    <a
                      href={`mailto:${__SUPPORT_EMAIL__}`}
                      className="text-gray-400 underline hover:text-gray-300"
                    >
                      {__SUPPORT_EMAIL__}
                    </a>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Include your account details and reason for reset in your
                    email.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Access Verification",
  icon: ChatBubbleLeftRight,
});

export default AccessPage;
