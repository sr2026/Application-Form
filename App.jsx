import { useState } from 'react'
import './App.css'

const STORAGE_KEY = 'registrationWizardSubmission'

const steps = [
  { title: 'Personal Details', shortTitle: 'Personal' },
  { title: 'Address', shortTitle: 'Address' },
  { title: 'Education', shortTitle: 'Education' },
  { title: 'Experience', shortTitle: 'Experience' },
  { title: 'Review', shortTitle: 'Review' },
]

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  degree: '',
  institution: '',
  graduationYear: '',
  specialization: '',
  employmentStatus: '',
  company: '',
  role: '',
  yearsExperience: '',
  skills: '',
}

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100
  const CurrentStepComponent = [
    PersonalDetails,
    AddressDetails,
    EducationDetails,
    ExperienceDetails,
    ReviewDetails,
  ][currentStep]

  const handleFieldChange = (field, value) => {
    setFormData((previousData) => ({
      ...previousData,
      [field]: value,
    }))

    setErrors((previousErrors) => {
      if (!previousErrors[field]) {
        return previousErrors
      }

      const nextErrors = { ...previousErrors }
      delete nextErrors[field]
      return nextErrors
    })

    if (submitted) {
      setSubmitted(false)
    }
  }

  const goToPreviousStep = () => {
    setErrors({})
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const goToStep = (stepIndex) => {
    setErrors({})
    setCurrentStep(stepIndex)
  }

  const goToNextStep = () => {
    const stepErrors = validateStep(currentStep, formData)

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setErrors({})
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (currentStep < steps.length - 1) {
      goToNextStep()
      return
    }

    const allErrors = validateAllSteps(formData)

    if (Object.keys(allErrors).length > 0) {
      const firstInvalidStep = steps.findIndex((_, index) =>
        Object.keys(validateStep(index, formData)).length > 0,
      )

      setErrors(validateStep(firstInvalidStep, formData))
      setCurrentStep(firstInvalidStep)
      return
    }

    saveSubmission(formData)
    setErrors({})
    setSubmitted(true)
    setIsModalOpen(true)
  }

  return (
    <main className="registration-app">
      <section className="app-header" aria-labelledby="registration-title">
        <p className="eyebrow">Application Form</p>
        <h1 id="registration-title">Create your profile</h1>
        <p className="intro">
          Complete the five steps and review your details before submitting.
        </p>
      </section>

      <section className="wizard-shell" aria-label="Registration form">
        <div className="progress-header">
          <div>
            <p className="step-count">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2>{steps[currentStep].title}</h2>
          </div>
          <span className="progress-percent">{Math.round(progress)}%</span>
        </div>

        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }}></span>
        </div>

        <ol className="step-list" aria-label="Registration progress">
          {steps.map((step, index) => {
            const isActive = currentStep === index
            const isComplete = currentStep > index

            return (
              <li
                className={`step-item ${isActive ? 'active' : ''} ${
                  isComplete ? 'complete' : ''
                }`}
                key={step.title}
              >
                <span className="step-index" aria-hidden="true">
                  {isComplete ? 'OK' : index + 1}
                </span>
                <span>{step.shortTitle}</span>
              </li>
            )
          })}
        </ol>

        {submitted && (
          <div className="success-banner" role="status">
            Application submitted. Your data is saved.
          </div>
        )}

        <form className="wizard-form" onSubmit={handleSubmit} noValidate>
          <CurrentStepComponent
            data={formData}
            errors={errors}
            onChange={handleFieldChange}
            onEdit={goToStep}
          />

          <div className="form-actions">
            <button
              className="button secondary"
              disabled={currentStep === 0}
              onClick={goToPreviousStep}
              type="button"
            >
              Previous
            </button>

            <button className="button primary" type="submit">
              {currentStep === steps.length - 1 ? 'Submit Application' : 'Next'}
            </button>
          </div>
        </form>
      </section>

      {isModalOpen && (
        <SubmissionModal
          email={formData.email}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  )
}

function saveSubmission(data) {
  saveToStorage(STORAGE_KEY, {
    data,
    submittedAt: new Date().toISOString(),
  })
}

function saveToStorage(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Keep the form usable if local storage is blocked by the browser.
  }
}

function validateAllSteps(data) {
  return steps.reduce(
    (allErrors, _, index) => ({
      ...allErrors,
      ...validateStep(index, data),
    }),
    {},
  )
}

function validateStep(stepIndex, data) {
  const nextErrors = {}
  const trimmed = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value.trim()]),
  )

  if (stepIndex === 0) {
    if (!trimmed.firstName) {
      nextErrors.firstName = 'First name is required.'
    } else if (trimmed.firstName.length < 2) {
      nextErrors.firstName = 'Use at least 2 characters.'
    }

    if (!trimmed.lastName) {
      nextErrors.lastName = 'Last name is required.'
    } else if (trimmed.lastName.length < 2) {
      nextErrors.lastName = 'Use at least 2 characters.'
    }

    if (!trimmed.email) {
      nextErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    const phoneDigits = trimmed.phone.replace(/\D/g, '')
    if (!trimmed.phone) {
      nextErrors.phone = 'Phone number is required.'
    } else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      nextErrors.phone = 'Use 10 to 15 digits.'
    }
  }

  if (stepIndex === 1) {
    if (!trimmed.street) {
      nextErrors.street = 'Street address is required.'
    }

    if (!trimmed.city) {
      nextErrors.city = 'City is required.'
    }

    if (!trimmed.region) {
      nextErrors.region = 'State or region is required.'
    }

    if (!trimmed.postalCode) {
      nextErrors.postalCode = 'ZIP or postal code is required.'
    } else if (!/^[a-z0-9][a-z0-9 -]{2,9}$/i.test(trimmed.postalCode)) {
      nextErrors.postalCode = 'Use a valid postal code.'
    }

    if (!trimmed.country) {
      nextErrors.country = 'Country is required.'
    }
  }

  if (stepIndex === 2) {
    const currentYear = new Date().getFullYear()
    const graduationYear = Number(trimmed.graduationYear)

    if (!trimmed.degree) {
      nextErrors.degree = 'Select your highest qualification.'
    }

    if (!trimmed.institution) {
      nextErrors.institution = 'Institution name is required.'
    }

    if (!trimmed.graduationYear) {
      nextErrors.graduationYear = 'Graduation year is required.'
    } else if (
      !Number.isInteger(graduationYear) ||
      graduationYear < 1950 ||
      graduationYear > currentYear + 8
    ) {
      nextErrors.graduationYear = `Use a year from 1950 to ${currentYear + 8}.`
    }
  }

  if (stepIndex === 3) {
    const yearsExperience = Number(trimmed.yearsExperience)
    const requiresEmployer =
      trimmed.employmentStatus === 'Employed' ||
      trimmed.employmentStatus === 'Self-employed'

    if (!trimmed.employmentStatus) {
      nextErrors.employmentStatus = 'Select your employment status.'
    }

    if (requiresEmployer && !trimmed.company) {
      nextErrors.company = 'Company or business name is required.'
    }

    if (requiresEmployer && !trimmed.role) {
      nextErrors.role = 'Current role is required.'
    }

    if (!trimmed.yearsExperience) {
      nextErrors.yearsExperience = 'Years of experience is required.'
    } else if (
      Number.isNaN(yearsExperience) ||
      yearsExperience < 0 ||
      yearsExperience > 50
    ) {
      nextErrors.yearsExperience = 'Use a number from 0 to 50.'
    }

    if (!trimmed.skills) {
      nextErrors.skills = 'Add at least one skill or area of interest.'
    }
  }

  return nextErrors
}

function SubmissionModal({ email, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="submission-title"
        aria-modal="true"
        className="submission-modal"
        role="dialog"
      >
        <p className="modal-kicker">Submission received</p>
        <h2 id="submission-title">Thank you for your submission</h2>
        <p>
          Your Application details have been saved
          {email ? ` for ${email}` : ''}.
        </p>
        <button className="button primary" onClick={onClose} type="button">
          Close
        </button>
      </section>
    </div>
  )
}

function PersonalDetails({ data, errors, onChange }) {
  return (
    <fieldset className="step-panel">
      <legend>Personal Details</legend>
      <div className="field-grid">
        <TextField
          autoComplete="given-name"
          error={errors.firstName}
          label="First name"
          name="firstName"
          onChange={onChange}
          required
          value={data.firstName}
        />
        <TextField
          autoComplete="family-name"
          error={errors.lastName}
          label="Last name"
          name="lastName"
          onChange={onChange}
          required
          value={data.lastName}
        />
        <TextField
          autoComplete="email"
          error={errors.email}
          label="Email address"
          name="email"
          onChange={onChange}
          required
          type="email"
          value={data.email}
        />
        <TextField
          autoComplete="tel"
          error={errors.phone}
          label="Phone number"
          name="phone"
          onChange={onChange}
          placeholder="10 digits"
          required
          type="tel"
          value={data.phone}
        />
      </div>
    </fieldset>
  )
}

function AddressDetails({ data, errors, onChange }) {
  return (
    <fieldset className="step-panel">
      <legend>Address</legend>
      <div className="field-grid">
        <TextField
          autoComplete="street-address"
          className="span-two"
          error={errors.street}
          label="Street address"
          name="street"
          onChange={onChange}
          required
          value={data.street}
        />
        <TextField
          autoComplete="address-level2"
          error={errors.city}
          label="City"
          name="city"
          onChange={onChange}
          required
          value={data.city}
        />
        <TextField
          autoComplete="address-level1"
          error={errors.region}
          label="State / Region"
          name="region"
          onChange={onChange}
          required
          value={data.region}
        />
        <TextField
          autoComplete="postal-code"
          error={errors.postalCode}
          label="ZIP / Postal code"
          name="postalCode"
          onChange={onChange}
          required
          value={data.postalCode}
        />
        <TextField
          autoComplete="country-name"
          error={errors.country}
          label="Country"
          name="country"
          onChange={onChange}
          required
          value={data.country}
        />
      </div>
    </fieldset>
  )
}

function EducationDetails({ data, errors, onChange }) {
  return (
    <fieldset className="step-panel">
      <legend>Education</legend>
      <div className="field-grid">
        <SelectField
          error={errors.degree}
          label="Highest qualification"
          name="degree"
          onChange={onChange}
          options={[
            'High School',
            'Diploma',
            "Bachelor's Degree",
            "Master's Degree",
            'Doctorate',
            'Other',
          ]}
          required
          value={data.degree}
        />
        <TextField
          error={errors.institution}
          label="Institution"
          name="institution"
          onChange={onChange}
          required
          value={data.institution}
        />
        <TextField
          error={errors.graduationYear}
          label="Graduation year"
          min="1950"
          name="graduationYear"
          onChange={onChange}
          required
          type="number"
          value={data.graduationYear}
        />
        <TextField
          error={errors.specialization}
          label="Specialization"
          name="specialization"
          onChange={onChange}
          placeholder="Optional"
          value={data.specialization}
        />
      </div>
    </fieldset>
  )
}

function ExperienceDetails({ data, errors, onChange }) {
  const employerDetailsRequired =
    data.employmentStatus === 'Employed' ||
    data.employmentStatus === 'Self-employed'

  return (
    <fieldset className="step-panel">
      <legend>Experience</legend>
      <div className="field-grid">
        <SelectField
          error={errors.employmentStatus}
          label="Employment status"
          name="employmentStatus"
          onChange={onChange}
          options={['Student', 'Employed', 'Self-employed', 'Unemployed']}
          required
          value={data.employmentStatus}
        />
        <TextField
          error={errors.yearsExperience}
          label="Years of experience"
          max="50"
          min="0"
          name="yearsExperience"
          onChange={onChange}
          required
          type="number"
          value={data.yearsExperience}
        />
        <TextField
          error={errors.company}
          label="Company / Business"
          name="company"
          onChange={onChange}
          placeholder={employerDetailsRequired ? '' : 'Optional'}
          required={employerDetailsRequired}
          value={data.company}
        />
        <TextField
          error={errors.role}
          label="Current role"
          name="role"
          onChange={onChange}
          placeholder={employerDetailsRequired ? '' : 'Optional'}
          required={employerDetailsRequired}
          value={data.role}
        />
        <TextAreaField
          className="span-two"
          error={errors.skills}
          label="Skills or interests"
          name="skills"
          onChange={onChange}
          placeholder="Example: React, project management, data analysis"
          required
          value={data.skills}
        />
      </div>
    </fieldset>
  )
}

function ReviewDetails({ data, onEdit }) {
  return (
    <section className="review-panel" aria-label="Review Application Form details">
      <p className="review-intro">
        Confirm the details below. Use edit to return to any step before
        submitting.
      </p>

      <SummarySection
        onEdit={() => onEdit(0)}
        rows={[
          ['Name', `${data.firstName} ${data.lastName}`],
          ['Email', data.email],
          ['Phone', data.phone],
        ]}
        title="Personal Details"
      />
      <SummarySection
        onEdit={() => onEdit(1)}
        rows={[
          ['Street', data.street],
          ['City', data.city],
          ['State / Region', data.region],
          ['ZIP / Postal code', data.postalCode],
          ['Country', data.country],
        ]}
        title="Address"
      />
      <SummarySection
        onEdit={() => onEdit(2)}
        rows={[
          ['Qualification', data.degree],
          ['Institution', data.institution],
          ['Graduation year', data.graduationYear],
          ['Specialization', data.specialization || 'Not provided'],
        ]}
        title="Education"
      />
      <SummarySection
        onEdit={() => onEdit(3)}
        rows={[
          ['Employment status', data.employmentStatus],
          ['Company / Business', data.company || 'Not provided'],
          ['Current role', data.role || 'Not provided'],
          ['Experience', `${data.yearsExperience || '0'} years`],
          ['Skills / Interests', data.skills],
        ]}
        title="Experience"
      />
    </section>
  )
}

function SummarySection({ title, rows, onEdit }) {
  return (
    <section className="summary-section">
      <div className="summary-heading">
        <h3>{title}</h3>
        <button className="edit-button" onClick={onEdit} type="button">
          Edit
        </button>
      </div>
      <dl className="summary-list">
        {rows.map(([label, value]) => (
          <div className="summary-row" key={label}>
            <dt>{label}</dt>
            <dd>{value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function TextField({
  className = '',
  error,
  label,
  name,
  onChange,
  required = false,
  type = 'text',
  value,
  ...inputProps
}) {
  return (
    <label className={`field ${className}`}>
      <span>
        {label}
        {required && <strong aria-hidden="true">*</strong>}
      </span>
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        id={name}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        type={type}
        value={value}
        {...inputProps}
      />
      {error && (
        <span className="error-text" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

function SelectField({
  error,
  label,
  name,
  onChange,
  options,
  required = false,
  value,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <strong aria-hidden="true">*</strong>}
      </span>
      <select
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        id={name}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        <option value="">Select one</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <span className="error-text" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

function TextAreaField({
  className = '',
  error,
  label,
  name,
  onChange,
  required = false,
  value,
  ...inputProps
}) {
  return (
    <label className={`field ${className}`}>
      <span>
        {label}
        {required && <strong aria-hidden="true">*</strong>}
      </span>
      <textarea
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        id={name}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        rows="4"
        value={value}
        {...inputProps}
      />
      {error && (
        <span className="error-text" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

export default App
