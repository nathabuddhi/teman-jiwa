import "@/App.css";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function HomePage() {
    return (
        <>
            <div className="flex flex-col w-full m-0 p-0 bg-white">
                {/* Hero Section */}
                <div
                    className="relative w-full h-[400px] md:h-[500px] bg-cover bg-center shadow-md"
                    style={{
                        backgroundImage: `url("./home.png")`,
                        backgroundPosition: "center 25%",
                    }}>
                    <div className="absolute inset-0 bg-black/30 flex items-end">
                        <div className="w-full bg-lightgreen bg-opacity-90 p-6 md:p-10 rounded-t-3xl">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-center text-darkgreen drop-shadow-sm">
                                SDG 3: Good Health and Well-Being
                            </h1>
                            <p className="text-center text-darkgreen mt-2 text-lg md:text-xl">
                                Ensureinghealthy lives and promoting well-being
                                for all.
                            </p>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-lightgreen bg-opacity-30 px-6 md:px-16 py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-semibold text-darkgreen mb-6">
                            About TemanJiwa
                        </h2>
                        <div className="bg-primarygreen rounded-2xl p-8 shadow-md">
                            <p className="text-white text-lg leading-relaxed">
                                TemanJiwa is here to be a trusted companion on
                                your journey to better mental wellness. We
                                provide a safe, accessible space to explore your
                                feelings, access self-help tools, and connect
                                with supportive resources.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <section className="py-20 px-6 md:px-10 bg-darkgreen text-white">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Start Your Wellness Journey Today
                        </h2>
                        <p className="mb-10 text-lg">
                            Join TemanJiwa and take the first step towards
                            better mental health and well-being.
                        </p>
                        <Link to="/login">
                            <Button className="bg-lightgreen text-darkgreen font-bold py-3 px-10 rounded-full text-lg shadow-lg hover:brightness-110 transition-all duration-300">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
