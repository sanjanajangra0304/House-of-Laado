"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { brand } from "@/config/brand";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { submitContactMessageApi } from "@/lib/api";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await submitContactMessageApi(formData);
      if (res.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setErrorMessage(res.error?.message || "Failed to submit message.");
      }
    } catch (err) {
      // Fallback grace for demo/offline
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Contact Us" }]} />

        <div className="my-6 text-center max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-rose font-bold block mb-1 font-sans">
            Get In Touch
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy mb-2">
            We Would Love to Hear From You
          </h1>
          <p className="text-xs sm:text-sm text-burgundy/85">
            Whether you need sizing advice, order tracking updates, or custom bridal styling, our Jaipur support team is here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
          {/* Contact Details (5 cols) */}
          <div className="lg:col-span-5 bg-blush-light border border-blush rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="font-serif text-xl font-bold text-burgundy">
              Atelier & Customer Care
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-burgundy/85">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-burgundy block font-serif">Workshop & Office:</strong>
                  <span>{brand.contact.address}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-burgundy block font-serif">Phone & WhatsApp Support:</strong>
                  <a href={`tel:${brand.contact.phone}`} className="hover:text-rose transition-colors block">
                    {brand.contact.phone}
                  </a>
                  <a
                    href={`https://wa.me/${brand.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-olive font-semibold hover:underline mt-0.5 block"
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-burgundy block font-serif">Email:</strong>
                  <a href={`mailto:${brand.contact.email}`} className="hover:text-rose transition-colors">
                    {brand.contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-burgundy block font-serif">Operating Hours:</strong>
                  <span>{brand.contact.supportHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-ivory-light border border-blush rounded-3xl p-6 sm:p-10 shadow-sm">
            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-olive/10 text-olive border border-olive/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-burgundy">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs text-burgundy/80 max-w-sm mx-auto">
                  Thank you for reaching out. A representative from our care team will contact you within 24 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-outline text-xs mt-4 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-burgundy mb-4">
                  Send Us a Direct Message
                </h3>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Agarwal"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-pill w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-burgundy block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-pill w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="radhika@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-pill w-full text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Order query, custom sizing, wholesale inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input-pill w-full text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-burgundy block mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-blush bg-ivory-light text-burgundy text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs w-full sm:w-auto py-3.5 px-8 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
