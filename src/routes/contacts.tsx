import { createFileRoute } from "@tanstack/react-router";
import { ContactsPage } from "@/pages/ContactsPage";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contact directory · CardSync AI" },
      {
        name: "description",
        content: "Search, filter, and manage every lead saved on this device.",
      },
      { property: "og:title", content: "Contact directory · CardSync AI" },
      {
        property: "og:description",
        content: "Your complete lead library, organised by status and channel.",
      },
    ],
  }),
  component: ContactsPage,
});
