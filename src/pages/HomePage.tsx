import "@/App.css";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function HomePage() {
    return (
        <>
            <div className="flex flex-col w-screen p-0 m-0">
                <div
                    className="relative w-full h-[400px] md:h-[500px] bg-cover bg-center"
                    style={{
                        backgroundImage: "home.png",
                        backgroundPosition: "center 25%",
                    }}>
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end">
                        <div className="w-full bg-lightgreen bg-opacity-80 p-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-center text-darkgreen">
                                SDG 3: Good Health and Well-Being
                            </h1>
                            <p className="text-center text-darkgreen mt-2">
                                Ensure healthy lives and promote well-being for
                                all at all ages
                            </p>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-lightgreen bg-opacity-30 p-6 md:p-10">
                    <h2 className="text-xl md:text-2xl font-semibold text-darkgreen mb-4">
                        About
                    </h2>
                    <div className="bg-primarygreen rounded-lg p-6 text-white">
                        <p className="text-center">
                            TemanJiwa is here to be a trusted companion on your
                            journey to better mental wellness by providing a
                            safe, accessible space for users to explore their
                            feelings, access self-help tools, and connect with
                            supportive resources.
                        </p>
                    </div>
                </div>
                <section className="py-16 px-4 bg-darkgreen text-white">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Start Your Wellness Journey Today
                        </h2>
                        <p className="mb-8">
                            Join TemanJiwa and take the first step towards
                            better mental health and well-being.
                        </p>
                        <Button className="bg-lightgreen hover:bg-opacity-90 text-darkgreen font-bold py-3 px-8 rounded-full text-lg">
                            <Link to="/login">Get Started</Link>
                        </Button>
                    </div>
                </section>
            </div>
        </>
    );
}
