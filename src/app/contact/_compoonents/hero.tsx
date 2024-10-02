import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <Link href="/contact" className="inline-flex items-center text-sm text-blue-600 mb-4">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                        Contact us
                    </Link>
                    <h1 className="text-[80px] font-normal leading-tight mb-4">
                        Starting a business or<br />
                        have a project in mind?<br />
                        <span className="text-gray-400">Let's chat.</span>
                    </h1>
                    <div className="w-full h-px bg-gray-200 mt-8"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-5xl font-normal mb-6 leading-tight">
                            From tiny to huge. If we love your project, we'll take it.
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            This email is open 24/7. The phone... not so much. But we're always here for you!
                            Whether you want to start a new project, improve your existing website, request
                            a quote, partner with us, or just say hi, don't hesitate to reach out.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-lg text-gray-600">hello@quarter.digital</span>
                            </div>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-lg text-gray-600">+44(0) 7467787495</span>
                            </div>
                        </div>
                        <div className="mt-12">
                            <Image src="/placeholder.svg?height=100&width=100" alt="Diamond illustration" width={100} height={100} />
                        </div>
                    </div>

                    <div>
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" id="name" name="name" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="email" name="email" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-1">Business name (optional)</label>
                                    <input type="text" id="business-name" name="business-name" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-1">Website url (optional)</label>
                                    <input type="url" id="website-url" name="website-url" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">What services are interested in?</label>
                                <div className="space-y-2">
                                    {['Web Design', 'Branding', 'Webflow Development', 'SEO', 'Other'].map((service) => (
                                        <div key={service} className="flex items-center">
                                            <input type="checkbox" id={service.toLowerCase()} name="services" value={service} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor={service.toLowerCase()} className="ml-2 block text-sm text-gray-700">{service}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">Do you have a budget in mind?</label>
                                <select id="budget" name="budget" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option>Select one...</option>
                                    <option>$1,000 - $5,000</option>
                                    <option>$5,000 - $10,000</option>
                                    <option>$10,000+</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea id="message" name="message" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Type your message..."></textarea>
                            </div>
                            <div className="flex items-center">
                                <input id="privacy-policy" name="privacy-policy" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="privacy-policy" className="ml-2 block text-sm text-gray-700">
                                    By clicking the Submit button you agree to our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> terms.
                                </label>
                            </div>
                            <div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Send message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}