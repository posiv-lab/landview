"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function Accordion({
  items
}: {
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;

        return (
          <div className="accordion__item" key={item.question}>
            <button
              aria-controls={panelId}
              aria-expanded={isOpen}
              className="accordion__button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              type="button"
            >
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform var(--motion-fast) var(--ease-standard)"
                }}
              />
            </button>
            {isOpen ? (
              <div className="accordion__panel" id={panelId}>
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
