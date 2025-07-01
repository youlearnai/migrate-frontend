import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/use-auth";
import { useErrorStore as useErrorModal } from "@/hooks/use-error-store";
import { Modal, ModalBody, ModalContent } from "@nextui-org/modal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const AuthModal = () => {
  const { t } = useTranslation();
  const { isOpen, closeModal, error } = useErrorModal();
  const pathname = usePathname();
  const { user, loading: isLoading } = useAuth();

  const getActionLink = (link: string) => {
    if (link === "/signin" || link === "/signup") {
      return `${link}?returnUrl=${encodeURIComponent(pathname)}`;
    }
    return link;
  };

  const effectiveError =
    !user && !isLoading && error?.status === 403
      ? { ...error, status: 401 }
      : error;

  // if user is logged in, do not show anything
  if (!isLoading && user) {
    return null;
  }

  // if loading, do not show anything
  if (isLoading) {
    return null;
  }

  // if 401 in sign in page, do not show anything
  if (error?.status === 401 && pathname.includes("sign")) {
    return null;
  }

  // if embed, do not show anything
  if (pathname.includes("/embed")) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen && effectiveError?.status === 401}
      onClose={closeModal}
      backdrop="blur"
      placement="center"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-md",
        base: "bg-white dark:bg-neutral-950 py-6 px-4 w-full max-w-md rounded-xl",
        closeButton:
          "hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:bg-transparent hover:text-primary p-1 right-3 top-3",
      }}
    >
      <ModalContent className="border">
        {(onClose) => (
          <>
            <ModalBody className="py-4">
              <h2 className="text-xl text-center font-medium">
                {t("signin.modal.title")}
              </h2>
              <p className="text-primary/60 text-center mb-3">
                {t("signin.modal.description")}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href={getActionLink("/signin")}
                  onClick={closeModal}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full h-12 text-md"
                    size="lg"
                  >
                    {t("accountMenu.signIn")}
                  </Button>
                </Link>
                <Link
                  href={getActionLink("/signup")}
                  onClick={closeModal}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full h-12 text-md border-primary/20"
                  >
                    {t("signInMessage.signUp")}
                  </Button>
                </Link>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
