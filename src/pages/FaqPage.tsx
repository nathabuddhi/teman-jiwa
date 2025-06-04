import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function FAQPage() {
  const faqs = [
    {
      question: "Is the module always updated?",
      answer:
        "Yes, our mental health modules are regularly reviewed and updated by professionals to ensure the content remains accurate, relevant, and aligned with the latest research and best practices.",
    },
    {
      question: "What preparations are needed before making an appointment?",
      answer:
        "Before making an appointment, we recommend identifying your concerns or goals for the session, ensuring a quiet and private space for online consultations (if applicable), and having any relevant medical or personal history on hand to help your mental health professional understand your situation better.",
    },
    {
      question:
        "If there is an unavoidable need, can the appointment be cancelled?",
      answer:
        "Yes, we understand that unexpected situations can arise. Appointments can be cancelled or rescheduled, ideally with advance notice. Please refer to our cancellation policy for more information on timelines and possible fees.",
    },
    {
      question:
        "What if I have a question I want to discuss regarding the module?",
      answer:
        "If you have any questions or need clarification about the module content, you’re welcome to reach out to our support team or bring it up during your session with a professional. We’re here to ensure you fully understand and benefit from the materials provided.",
    },
  ];

  return (
    <div className="h-screen w-7xl mx-auto px-4 py-12">
      <div className="bg-green-200  rounded-lg p-8">
        <h1 className="text-4xl font-bold text-green-800 mb-4">FAQs</h1>
        <p className="text-green-700 mb-8 leading-relaxed">
          In this FAQ section, we will address some of the most commonly asked
          questions to help you get the information you need quickly and easily.
          If you can't find what you're looking for, please don't hesitate to
          contact us.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Collapsible key={index}>
              <CollapsibleTrigger className="flex items-center justify-between w-full bg-white/50 hover:bg-white/70 rounded-lg p-4 text-left transition-colors">
                <span className="text-green-800 font-medium">
                  {faq.question}
                </span>
                <ChevronDown className="h-5 w-5 text-green-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-white/30 rounded-lg mt-2 p-4">
                <p className="text-green-700">{faq.answer}</p>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}
