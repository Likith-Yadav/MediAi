import React from 'react';
import { MedicalReport } from '@/components/MedicalReport';

export default function MedicalReportExample() {
  const reportData = {
    imageType: "Chest X-ray (PA view)",
    anatomicalRegion: "Chest, including lungs, heart, ribs, and clavicles",
    findings: [
      {
        title: "Lung Fields",
        description: "The lung fields demonstrate fairly normal aeration. There are no readily apparent large opacities suggestive of pneumonia or significant masses. However, there is some increased lung marking/texture throughout both lung fields, more pronounced in the lower zones. This could be due to several factors, making it difficult to pinpoint a definitive cause from this image alone."
      },
      {
        title: "Abnormalities/Concerning Features",
        description: "No significant focal abnormalities like nodules or masses are clearly visible on this x-ray. The increased lung markings are the main area of concern and warrants further investigation."
      },
      {
        title: "Tissue Characteristics/Density Variations",
        description: "The heart size appears to be within normal limits for the given image. The bony structures (ribs, clavicles) show no obvious fractures or dislocations. The increased lung markings are characterized by slightly more pronounced lines and shadows within the lung tissue compared to the expected normal pattern on a chest X-ray. This increased density could potentially indicate underlying interstitial lung disease, chronic bronchitis, or other conditions that affect the lungs' interstitial tissues."
      }
    ],
    clinicalInterpretation: [
      "The increased lung markings on this chest x-ray are the primary finding of concern. This could indicate a variety of conditions, including but not limited to chronic obstructive pulmonary disease (COPD), interstitial lung disease, or early stages of other respiratory illnesses.",
      "The potential medical implications range from relatively benign conditions (e.g., mild chronic bronchitis) to more serious diseases (e.g., certain forms of lung fibrosis). The patient's symptoms, medical history, and other factors will determine the appropriate diagnosis.",
      "A normal chest x-ray would show relatively clear lung fields with a minimal amount of lung markings. This image shows a deviation from that normal pattern."
    ],
    recommendations: [
      {
        title: "Medical Follow-up",
        description: "A follow-up appointment with your primary care physician or a pulmonologist (lung specialist) is necessary to discuss your symptoms, medical history, and the results of this chest x-ray."
      },
      {
        title: "Additional Tests",
        description: [
          "Blood tests: To evaluate for infection or other underlying medical conditions.",
          "Pulmonary function tests (PFTs): To assess lung capacity and function.",
          "High-resolution computed tomography (HRCT) scan of the chest: A more detailed imaging study that can better visualize subtle lung abnormalities.",
          "Arterial Blood Gas (ABG): This can indicate oxygen levels in the blood, potentially giving clues to the severity of lung changes."
        ]
      },
      {
        title: "Lifestyle/Preventive Measures",
        description: "This will depend heavily on the eventual diagnosis. In the meantime, maintaining a healthy lifestyle, including avoiding smoking (if applicable), getting regular exercise, and practicing good respiratory hygiene, is generally beneficial for lung health."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <MedicalReport {...reportData} />
    </div>
  );
} 