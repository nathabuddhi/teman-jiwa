import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-300 to-yellow-200">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8">
            <h1 className="text-4xl font-bold text-green-800 mb-6">
              CONTACT
              <br />
              JIWATEAM
            </h1>
            <p className="text-green-700 leading-relaxed">
              Have questions or need support?
              <br />
              Get in touch with us and we're here to help.
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white/30 backdrop-blur-sm rounded-lg p-8">
            <form className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-green-800 font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  className="mt-2 bg-white/70 border-green-200 focus:border-green-400"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-green-800 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-2 bg-white/70 border-green-200 focus:border-green-400"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-green-800 font-medium">
                  Subject
                </Label>
                <Input
                  id="subject"
                  type="text"
                  className="mt-2 bg-white/70 border-green-200 focus:border-green-400"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-green-800 font-medium">
                  Message
                </Label>
                <Textarea
                  id="message"
                  rows={6}
                  className="mt-2 bg-white/70 border-green-200 focus:border-green-400 resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3">
                Submit
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
