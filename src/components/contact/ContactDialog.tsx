"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { Button, type ButtonProps } from "@/components/ui/Button";

const ContactDialogContext = createContext<(() => void) | null>(null);

export function ContactDialogProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <ContactDialogContext.Provider value={() => setIsOpen(true)}>
      {children}
      <dialog
        aria-labelledby="contact-dialog-title"
        className="contact-dialog"
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsOpen(false);
          }
        }}
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="contact-dialog__panel">
          <div className="contact-dialog__header">
            <div>
              <p className="eyebrow">서비스 문의</p>
              <h2 id="contact-dialog-title">땅뷰에 문의하기</h2>
              <p>궁금한 지역이나 필요한 기능을 알려주시면 확인 후 연락드리겠습니다.</p>
            </div>
            <button
              aria-label="문의 창 닫기"
              className="contact-dialog__close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={22} />
            </button>
          </div>
          <ContactForm source="modal" />
        </div>
      </dialog>
    </ContactDialogContext.Provider>
  );
}

type ContactButtonProps = Omit<ButtonProps, "href" | "onClick" | "type">;

export function ContactButton(props: ContactButtonProps) {
  const openDialog = useContext(ContactDialogContext);

  if (!openDialog) {
    throw new Error("ContactButton은 ContactDialogProvider 안에서 사용해야 합니다.");
  }

  return <Button {...props} onClick={openDialog} type="button" />;
}
