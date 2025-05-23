import React, { useState, useEffect } from "react";
import Layout from "@/layouts/Default";
import { useTranslation } from "next-i18next";
import { $serverFetch } from "@/utils/api";
import $fetch from "@/utils/api";
import Card from "@/components/elements/base/card/Card";
import Input from "@/components/elements/form/input/Input";
import Button from "@/components/elements/base/button/Button";
import Alert from "@/components/elements/base/alert/Alert";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import IconBox from "@/components/elements/base/iconbox/IconBox";
import { Icon } from "@iconify/react";
import { BackButton } from "@/components/elements/base/button/BackButton";
import { useDashboardStore } from "@/stores/dashboard";

interface UpdateData {
  status: boolean;
  message: string;
  changelog: string | null;
  update_id: string;
  version: string;
}

interface Props {
  initialProductId: string;
  initialBlockchainVersion: string;
  initialBlockchainName: string | null;
  initialBlockchainChain: string | null;
  initialBlockchainStatus: boolean;
  initialLicenseVerified: boolean;
  initialUpdateData: UpdateData;
}

const BlockchainDetails: React.FC<Props> = ({
  initialProductId,
  initialBlockchainVersion,
  initialBlockchainName,
  initialBlockchainChain,
  initialBlockchainStatus,
  initialLicenseVerified,
  initialUpdateData,
}) => {
  const { t } = useTranslation();
  const { isDark } = useDashboardStore();

  const [productId] = useState(initialProductId);
  const [blockchainVersion, setBlockchainVersion] = useState(
    initialBlockchainVersion
  );
  const [blockchainName] = useState(initialBlockchainName);
  const [blockchainChain] = useState(initialBlockchainChain);
  const [blockchainStatus, setBlockchainStatus] = useState(
    initialBlockchainStatus
  );

  const [licenseVerified, setLicenseVerified] = useState(
    initialLicenseVerified
  );
  const [updateData, setUpdateData] = useState<UpdateData>(initialUpdateData);

  const [purchaseCode, setPurchaseCode] = useState("");
  const [envatoUsername, setEnvatoUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateChecking, setIsUpdateChecking] = useState(false);

  // Skeleton colors
  const [skeletonProps, setSkeletonProps] = useState({
    baseColor: "#f7fafc",
    highlightColor: "#edf2f7",
  });

  useEffect(() => {
    setSkeletonProps({
      baseColor: isDark ? "#27272a" : "#f7fafc",
      highlightColor: isDark ? "#3a3a3e" : "#edf2f7",
    });
  }, [isDark]);

  const externalNotesUrl = "https://support.mash3div.com/pages/5/update-notes";

  const checkForUpdates = async () => {
    if (!productId || !blockchainVersion) return;
    setIsUpdateChecking(true);
    const { data } = await $fetch({
      url: `/api/admin/system/update/check`,
      method: "POST",
      body: { productId, currentVersion: blockchainVersion },
      silent: true,
    });
    if (data) {
      setUpdateData({
        ...data,
        message: data.message,
      });
    }
    setIsUpdateChecking(false);
  };

  const updateBlockchain = async () => {
    setIsUpdating(true);
    const { error } = await $fetch({
      url: `/api/admin/system/update/download`,
      method: "POST",
      body: {
        productId,
        updateId: updateData.update_id,
        version: updateData.version,
        product: blockchainName,
        type: "blockchain",
      },
    });
    if (!error) {
      setBlockchainVersion(updateData.version);
    }
    setIsUpdating(false);
  };

  const activateLicenseAction = async () => {
    setIsSubmitting(true);
    const { data } = await $fetch({
      url: `/api/admin/system/license/activate`,
      method: "POST",
      body: { productId, purchaseCode, envatoUsername },
    });
    if (data) {
      setLicenseVerified(data.status);
    }
    setIsSubmitting(false);
  };

  const handleActivateBlockchain = async () => {
    setIsSubmitting(true);
    const { error } = await $fetch({
      url: `/api/admin/ext/ecosystem/blockchain/${productId}/status`,
      method: "PUT",
      body: { status: !blockchainStatus },
    });
    if (!error) {
      setBlockchainStatus(!blockchainStatus);
    }
    setIsSubmitting(false);
  };

  const noUpdateAvailable =
    !updateData.status &&
    updateData.message === "You have the latest version of Bicrypto.";

  const errorOrFallbackScenario =
    !updateData.status &&
    updateData.message !== "You have the latest version of Bicrypto." &&
    updateData.message !== "";

  return (
    <Layout title={t("Blockchain Details")} color="muted">
      {/* Top Bar */}
      <div className="flex justify-between items-center w-full mb-8 text-muted-800 dark:text-muted-200">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold">
            {blockchainChain || t("Blockchain Details")}
          </h1>
          <p className="text-sm text-muted-600 dark:text-muted-400">
            {t("Current Version")}:{" "}
            <span className="font-medium text-info-500">
              {blockchainVersion}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`w-4 h-4 rounded-full animate-pulse ${
              licenseVerified ? "bg-green-500" : "bg-red-500"
            }`}
            title={
              licenseVerified
                ? t("License Verified")
                : t("License Not Verified")
            }
          />
          <span className="text-sm">
            {licenseVerified
              ? t("License Verified")
              : t("License Not Verified")}
          </span>

          {blockchainVersion !== "0.0.1" && (
            <Button
              color={blockchainStatus ? "danger" : "success"}
              onClick={handleActivateBlockchain}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              <Icon
                icon={blockchainStatus ? "carbon:close" : "carbon:checkmark"}
                className="mr-2 h-5 w-5"
              />
              {blockchainStatus ? t("Disable") : t("Enable")}
            </Button>
          )}
          <BackButton href={"/admin/ext/ecosystem"} />
        </div>
      </div>

      {/* Always show three-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Section (2/3) */}
        <div className="col-span-2 space-y-6">
          {isUpdateChecking ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton height={48} {...skeletonProps} />
              </div>
              <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700">
                <div className="space-y-4">
                  <Skeleton height={20} width={120} {...skeletonProps} />
                  <Skeleton count={3} {...skeletonProps} />
                </div>
              </Card>
            </div>
          ) : (
            <>
              {updateData.status && (
                <div className="space-y-3">
                  <Alert
                    color="info"
                    icon="material-symbols-light:info-outline"
                    canClose={false}
                    className="text-md"
                  >
                    {t(
                      "Please backup your database and blockchain files before upgrading"
                    )}
                    .
                  </Alert>
                  {updateData.message && (
                    <Alert canClose={false} color="success" className="text-md">
                      {updateData.message}
                    </Alert>
                  )}
                </div>
              )}

              {noUpdateAvailable && (
                <>
                  <Alert canClose={false} color="success" className="text-md">
                    {updateData.message}
                  </Alert>
                  <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {t("Update Notes")}
                    </h3>
                    <p className="text-sm text-muted-600 dark:text-muted-400">
                      {t(
                        "There are no updates available for your system at this time."
                      )}
                    </p>
                  </Card>
                </>
              )}

              {errorOrFallbackScenario && (
                <Alert canClose={false} color="warning" className="text-md">
                  {updateData.message ||
                    t("Unable to retrieve update information.")}
                </Alert>
              )}

              {updateData.status && updateData.changelog && (
                <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {t("Update Notes")}
                  </h3>
                  <div
                    className="pl-5 prose dark:prose-dark text-muted-800 dark:text-muted-200 text-sm overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{
                      __html: updateData.changelog || "",
                    }}
                  />
                </Card>
              )}
            </>
          )}
        </div>

        {/* Right Section (1/3) */}
        <div className="col-span-1 space-y-6">
          <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {t("Update Actions")}
            </h3>
            <p className="text-sm text-muted-600 dark:text-muted-400">
              {updateData.status
                ? t(
                    "Update to the latest version once your license is verified."
                  )
                : t(
                    "No updates available or unable to retrieve updates. You can re-check at any time."
                  )}
            </p>
            {isUpdateChecking ? (
              <div className="flex flex-col gap-3">
                <Skeleton height={32} width="100%" {...skeletonProps} />
                <Skeleton height={32} width="100%" {...skeletonProps} />
              </div>
            ) : (
              <>
                <Button
                  onClick={updateBlockchain}
                  color="success"
                  className="w-full"
                  type="submit"
                  disabled={
                    !updateData.status ||
                    !licenseVerified ||
                    updateData.update_id === "" ||
                    isUpdating
                  }
                  loading={isUpdating}
                >
                  {blockchainVersion === "0.0.1" ? t("Install") : t("Update")}
                </Button>
                <Button
                  onClick={checkForUpdates}
                  color="primary"
                  className="w-full"
                  type="button"
                  disabled={isUpdateChecking}
                  loading={isUpdateChecking}
                >
                  {t("Check for Updates")}
                </Button>
              </>
            )}
          </Card>

          {!licenseVerified && (
            <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                {t("License Verification")}
              </h4>
              <p className="text-sm text-muted-600 dark:text-muted-400">
                {t(
                  "Please enter your purchase details to verify your license."
                )}
              </p>
              <Input
                value={purchaseCode}
                onChange={(e) => setPurchaseCode(e.target.value)}
                type="text"
                label={t("Purchase Code")}
                placeholder={t("Enter your purchase code")}
              />
              <Input
                value={envatoUsername}
                onChange={(e) => setEnvatoUsername(e.target.value)}
                type="text"
                label={t("Envato Username")}
                placeholder={t("Enter your Envato username")}
              />
              <Button
                color="primary"
                className="w-full"
                onClick={activateLicenseAction}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {t("Activate License")}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const permission = "Access Blockchain Management";

export async function getServerSideProps(context: any) {
  try {
    const { productId } = context.query;

    if (!productId) {
      return {
        props: {
          initialProductId: "",
          initialBlockchainVersion: "",
          initialBlockchainName: null,
          initialBlockchainChain: null,
          initialBlockchainStatus: false,
          initialLicenseVerified: false,
          initialUpdateData: {
            status: false,
            message: "No product selected",
            changelog: null,
            update_id: "",
            version: "",
          },
        },
      };
    }

    // Fetch blockchain data
    const blockchainResponse = await $serverFetch(context, {
      url: `/api/admin/ext/ecosystem/blockchain/${productId}`,
    });

    const blockchainData = blockchainResponse.data || {};
    const blockchainVersion = blockchainData.version || "";
    const blockchainName = blockchainData.name || null;
    const blockchainChain = blockchainData.chain || null;
    const blockchainStatus = blockchainData.status || false;

    let licenseVerified = false;
    let updateData: UpdateData = {
      status: false,
      message: "You have the latest version of Bicrypto.",
      changelog: null,
      update_id: "",
      version: blockchainVersion,
    };

    // Verify license
    if (productId && blockchainName) {
      const licenseVerification = await $serverFetch(context, {
        url: `/api/admin/system/license/verify`,
        method: "POST",
        body: { productId },
      });
      licenseVerified = licenseVerification?.data?.status ?? false;
    }

    // Check for updates if license verified
    if (licenseVerified && productId && blockchainVersion) {
      const updateCheck = await $serverFetch(context, {
        url: `/api/admin/system/update/check`,
        method: "POST",
        body: { productId, currentVersion: blockchainVersion },
      });
      if (updateCheck.data) {
        updateData = {
          ...updateData,
          ...updateCheck.data,
          message: updateCheck.data.message,
        };
      }
    }

    return {
      props: {
        initialProductId: productId,
        initialBlockchainVersion: blockchainVersion,
        initialBlockchainName: blockchainName,
        initialBlockchainChain: blockchainChain,
        initialBlockchainStatus: blockchainStatus,
        initialLicenseVerified: licenseVerified,
        initialUpdateData: updateData,
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        initialProductId: "",
        initialBlockchainVersion: "",
        initialBlockchainName: null,
        initialBlockchainChain: null,
        initialBlockchainStatus: false,
        initialLicenseVerified: false,
        initialUpdateData: {
          status: false,
          message: "Unable to check for updates at this time.",
          changelog: null,
          update_id: "",
          version: "",
        },
      },
    };
  }
}

export default BlockchainDetails;
