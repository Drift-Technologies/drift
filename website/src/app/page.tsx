import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#E0E0E0] text-[#333333] p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold">Landing Soon</h1>
        <p className="max-w-md text-lg">
          We will be launching Drift very soon. Add your email
          below and be among the first to know when we officially launch.
        </p>
        <form className="flex w-full max-w-sm">
          <input
            type="email"
            placeholder="Enter Your Email Address"
            className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#333333]"
            // We'll add email validation and submission logic later
          />
          <button
            type="submit"
            className="bg-[#333333] text-white p-3 rounded-r-md hover:bg-[#4A4A4A] font-semibold"
          >
            SUBMIT
          </button>
        </form>
      </main>
    </div>
  );
}
