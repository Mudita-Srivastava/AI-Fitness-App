"use client";

import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

let currentUtterance = null;

export default function FitnessForm() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    level: "",
    diet: "",
    location: "",
    notes: "",
  });

  const [aiPlan, setAiPlan] = useState(null);
  const [error, setError] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem("fitnessPlan");
    if (savedPlan) setAiPlan(JSON.parse(savedPlan));
  }, []);

  //speak test
  function speakText(text) {
    window.speechSynthesis.cancel();
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 1;
    currentUtterance.pitch = 1;
    window.speechSynthesis.speak(currentUtterance);
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setAiPlan(null);
    setLoadingPlan(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setAiPlan(data.result);
      localStorage.setItem("fitnessPlan", JSON.stringify(data.result));
    } catch (err) {
      setError("Something went wrong while generating the plan.");
    } finally {
      setLoadingPlan(false);
    }
  }

  //image generation
  async function generateImage(prompt) {
    try {
      setLoadingImage(true);
      setGeneratedImage(null);

      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.error) {
        alert("Image error: " + data.error);
        setLoadingImage(false);
        return;
      }

      setGeneratedImage(data.image);
    } catch (err) {
      console.log(err);
      alert("Something went wrong with image generation");
      setLoadingImage(false);
    }
  }

  //export plan pdf
  function exportPDF() {
    if (!aiPlan) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text(`Fitness Plan for ${formData.name}`, 10, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Workout Plan", 10, y);
    y += 8;
    aiPlan.workout_plan.forEach((day) => {
      doc.setFontSize(14);
      doc.text(day.day, 10, y);
      y += 6;
      day.exercises.forEach((ex) => {
        doc.setFontSize(12);
        const line = `${ex.name} — ${ex.sets} sets × ${ex.reps} | ${ex.desc}`;
        const wrapped = doc.splitTextToSize(line, 180);
        wrapped.forEach((l) => {
          doc.text(l, 12, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
      });
      y += 4;
    });

    doc.setFontSize(14);
    doc.text("Diet Plan", 10, y);
    y += 8;
    Object.keys(aiPlan.diet_plan).forEach((meal) => {
      doc.setFontSize(12);
      const line = `${meal.toUpperCase()}: ${aiPlan.diet_plan[meal].join(
        ", "
      )}`;
      const wrapped = doc.splitTextToSize(line, 180);
      wrapped.forEach((l) => {
        doc.text(l, 12, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    });

    doc.setFontSize(14);
    doc.text("Tips", 10, y);
    y += 8;
    aiPlan.tips.forEach((tip) => {
      doc.setFontSize(12);
      const wrapped = doc.splitTextToSize(`- ${tip}`, 180);
      wrapped.forEach((l) => {
        doc.text(l, 12, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    });

    doc.setFontSize(14);
    doc.text("Motivation", 10, y);
    y += 8;
    const wrappedMotivation = doc.splitTextToSize(aiPlan.motivation, 180);
    wrappedMotivation.forEach((l) => {
      doc.setFontSize(12);
      doc.text(l, 12, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`${formData.name}_fitness_plan.pdf`);
  }

  return (
    <div className="bg-gradient-to-b from-orange-50 to-orange-100 min-h-screen py-10">
      <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-orange-200">
        <h2 className="text-3xl font-bold text-center mb-6 text-orange-800">
          AI Fitness Plan Generator
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          {[
            { label: "Name", name: "name", type: "text" },
            { label: "Age", name: "age", type: "number" },
            {
              label: "Gender",
              name: "gender",
              type: "select",
              options: ["Male", "Female", "Other"],
            },
            { label: "Height (cm)", name: "height", type: "number" },
            { label: "Weight (kg)", name: "weight", type: "number" },
            {
              label: "Fitness Goal",
              name: "goal",
              type: "select",
              options: [
                "Weight Loss",
                "Muscle Gain",
                "General Fitness",
                "Strength",
              ],
            },
            {
              label: "Experience Level",
              name: "level",
              type: "select",
              options: ["Beginner", "Intermediate", "Advanced"],
            },
            {
              label: "Diet Preference",
              name: "diet",
              type: "select",
              options: ["Veg", "Non-Veg", "Vegan"],
            },
            {
              label: "Workout Location",
              name: "location",
              type: "select",
              options: ["Home", "Gym", "Outdoor"],
            },
          ].map((field) => (
            <div key={field.name}>
              <label className="block mb-1 font-medium text-orange-700">
                {field.label}:
              </label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Select</option>
                  {field.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              )}
            </div>
          ))}

          <div className="lg:col-span-2">
            <label className="block mb-1 font-medium text-orange-700">
              Optional Notes:
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-xl font-semibold shadow-md transition duration-300"
            >
              Generate My Plan
            </button>
            {loadingPlan && (
              <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-700 rounded-full animate-spin mx-auto my-4"></div>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-4 text-red-600 font-medium">❌ {error}</div>
        )}

        {/* Result Section */}
        {aiPlan && (
          <div className="mt-6 p-6 bg-orange-50 rounded-2xl border border-orange-200 space-y-5">
            {/* Workout Plan */}
            <h2 className="text-2xl font-bold text-orange-800">Workout Plan</h2>
            {aiPlan.workout_plan?.map((day, i) => (
              <div key={i}>
                <h3 className="font-semibold text-orange-700">{day.day}</h3>
                {day.exercises.map((ex, j) => (
                  <p
                    key={j}
                    className="text-gray-800 cursor-pointer hover:text-orange-600 transition"
                    onClick={() =>
                      generateImage(
                        `professional gym photo of a person doing ${ex.name}, proper form, realistic body, sharp lighting, clean background`
                      )
                    }
                  >
                    <strong>{ex.name}</strong> — {ex.sets} sets × {ex.reps}
                    <br />
                    {ex.desc}
                  </p>
                ))}
              </div>
            ))}

            {/* Diet Plan */}
            <h2 className="text-2xl font-bold text-orange-800 mt-5">
              Diet Plan
            </h2>
            {["breakfast", "lunch", "dinner", "snacks"].map((meal) => (
              <p key={meal} className="text-gray-800 mt-1">
                <strong>{meal.toUpperCase()}:</strong>{" "}
                {aiPlan.diet_plan[meal].map((item, idx) => (
                  <span
                    key={idx}
                    className="cursor-pointer hover:text-orange-600 transition"
                    onClick={() =>
                      generateImage(
                        `high quality delicious healthy food photo of ${item}, bright lighting, clean plate`
                      )
                    }
                  >
                    {item}
                    {idx < aiPlan.diet_plan[meal].length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            ))}

            {loadingImage && (
              <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-700 rounded-full animate-spin mx-auto my-4"></div>
            )}

            {generatedImage && (
              <img
                src={generatedImage}
                alt="AI Generated"
                className="w-full mt-4 rounded-xl border border-orange-300"
                onLoad={() => setLoadingImage(false)}
              />
            )}

            {/* Tips */}
            <h2 className="text-2xl font-bold text-orange-800 mt-5">Tips</h2>
            <ul className="list-disc list-inside text-gray-800">
              {aiPlan.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>

            {/* Motivation */}
            <h2 className="text-2xl font-bold text-orange-800 mt-5">
              Motivation
            </h2>
            <p className="text-gray-800">{aiPlan.motivation}</p>

            {/* Speech Controls */}
            <h2 className="text-2xl font-bold text-orange-800 mt-5">
              🔊 Read My Plan
            </h2>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => speakText(JSON.stringify(aiPlan.workout_plan))}
                className="bg-orange-700 hover:bg-orange-800 text-white py-2 rounded-xl font-semibold transition duration-300"
              >
                ▶ Read Workout Plan
              </button>
              <button
                onClick={() => speakText(JSON.stringify(aiPlan.diet_plan))}
                className="bg-orange-700 hover:bg-orange-800 text-white py-2 rounded-xl font-semibold transition duration-300"
              >
                ▶ Read Diet Plan
              </button>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => window.speechSynthesis.pause()}
                  className="flex-1 bg-orange-700 hover:bg-orange-800 text-white py-2 rounded-xl font-semibold transition duration-300"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={() => window.speechSynthesis.resume()}
                  className="flex-1 bg-orange-700 hover:bg-orange-800 text-white py-2 rounded-xl font-semibold transition duration-300"
                >
                  ▶ Resume
                </button>
                <button
                  onClick={() => window.speechSynthesis.cancel()}
                  className="flex-1 bg-orange-700 hover:bg-orange-800 text-white py-2 rounded-xl font-semibold transition duration-300"
                >
                  ⛔ Stop
                </button>
              </div>
            </div>

            {/* Export & Save Plan */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={exportPDF}
                className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-xl font-semibold shadow-md transition duration-300"
              >
                💾 Export Plan as PDF
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("fitnessPlan");
                  setAiPlan(null);
                }}
                className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-xl font-semibold shadow-md transition duration-300"
              >
                🗑 Clear Saved Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
