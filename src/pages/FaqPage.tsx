import { ChevronDown } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function FAQPage() {
    const faqs = [
        {
            question: "Question 1",
            answer: "This is the answer to question 1. It provides detailed information about the topic.",
        },
        {
            question: "Question 2",
            answer: "This is the answer to question 2. It explains the relevant details clearly.",
        },
        {
            question: "Question 3",
            answer: "This is the answer to question 3. It covers all the important points.",
        },
        {
            question: "Question 4",
            answer: "This is the answer to question 4. It provides comprehensive information.",
        },
    ];

    return (
        <div className="h-screen w-7xl mx-auto px-4 py-12">
            <div className="bg-green-200  rounded-lg p-8">
                <h1 className="text-4xl font-bold text-green-800 mb-4">FAQs</h1>
                <p className="text-green-700 mb-8 leading-relaxed">
                    In this FAQ section, we will address some of the most
                    commonly asked questions to help you get the information you
                    need quickly and easily. If you can't find what you're
                    looking for, please don't hesitate to contact us.
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
