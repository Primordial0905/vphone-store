const registerForm = document.getElementById("registerForm")

const fullNameInput = document.getElementById("fullName")
const genderInputs = document.querySelectorAll('input[name="gender"]')
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const confirmPasswordInput = document.getElementById("confirmPassword")
const termsCheckbox = document.getElementById("terms")

const fullNameError = document.getElementById("fullNameError")
const genderError = document.getElementById("genderError")
const emailError = document.getElementById("emailError")
const passwordError = document.getElementById("passwordError")
const confirmPasswordError = document.getElementById("confirmPasswordError")
const termsError = document.getElementById("termsError")

const strengthBar = document.getElementById("strengthBar")
const strengthText = document.getElementById("strengthText")

// name
function validateFullName() {
  const fullName = fullNameInput.value.trim()

  if (fullName === "") {
    fullNameError.textContent = "Full name is required"
    return false
  } else if (fullName.length < 3) {
    fullNameError.textContent = "Full name must be at least 3 characters"
    return false
  } else {
    fullNameError.textContent = ""
    return true
  }
}

// gender
function validateGender() {
  let selected = false

  genderInputs.forEach((input) => {
    if (input.checked) {
      selected = true
    }
  })

  if (!selected) {
    genderError.textContent = "Please select your gender"
    return false
  } else {
    genderError.textContent = ""
    return true
  }
}

// email
function validateEmail() {
  const email = emailInput.value.trim()

  if (email === "") {
    emailError.textContent = "Email address is required"
    return false
  } else if (!isValidEmail(email)) {
    emailError.textContent = "Please enter a valid email address"
    return false
  } else {
    emailError.textContent = ""
    return true
  }
}

function isValidEmail(email) {
  const atIndex = email.indexOf("@")
  const dotIndex = email.lastIndexOf(".")

  return atIndex > 0 && 
  dotIndex < email.length - 1 && 
  email.indexOf(" ") === -1
}

// password
function validatePassword() {
  const password = passwordInput.value

  if (password === "") {
    passwordError.textContent = "Password is required"
    return false
  } else if (password.length < 8) {
    passwordError.textContent = "Password must be at least 8 characters"
    return false
  } else {
    passwordError.textContent = ""
    return true
  }
}

// password bar
function checkPasswordStrength() {
  const password = passwordInput.value
  let strength = 0

  if (password.length >= 8) {
    strength += 1
  }

  if (password.length >= 12) {
    strength += 1
  }

  if (password.split('').some(char => char >= 'A' && char <= 'Z')) {
    strength += 1
  }

  if (password.split('').some(char => char >= 'a' && char <= 'z')) {
    strength += 1
  }

  if (password.split('').some(char => char >= '0' && char <= '9')) {
    strength += 1
  }

  if (password.split('').some(char => 
    !(char >= 'A' && char <= 'Z' ) &&
    !(char >= 'a' && char <= 'z') &&
    !(char >= '0' && char <= '9') &&
    char !== ' ')) {
    strength += 1
  }
  
  switch (strength) {
    case 0:
    case 1:
      strengthBar.style.width = "20%"
      strengthBar.style.backgroundColor = "#f44336"
      strengthText.textContent = "Weak"
      break
    case 2:
    case 3:
      strengthBar.style.width = "50%"
      strengthBar.style.backgroundColor = "#ff9800"
      strengthText.textContent = "Moderate"
      break
    case 4:
    case 5:
      strengthBar.style.width = "80%"
      strengthBar.style.backgroundColor = "#4caf50"
      strengthText.textContent = "Strong"
      break
    case 6:
      strengthBar.style.width = "100%"
      strengthBar.style.backgroundColor = "#2e7d32"
      strengthText.textContent = "Very Strong"
      break
    default:
      strengthBar.style.width = "0"
      strengthText.textContent = "Password strength"
  }
}

// confirm password 
function validateConfirmPassword() {
  const password = passwordInput.value
  const confirmPassword = confirmPasswordInput.value

  if (confirmPassword === "") {
    confirmPasswordError.textContent = "Please confirm your password"
    return false
  } else if (password !== confirmPassword) {
    confirmPasswordError.textContent = "Passwords do not match"
    return false
  } else {
    confirmPasswordError.textContent = ""
    return true
  }
}

// terms n conditions
function validateTerms() {
  if (!termsCheckbox.checked) {
    termsError.textContent = "You must agree to the Terms and Conditions"
    return false
  } else {
    termsError.textContent = ""
    return true
  }
}

// live check
fullNameInput.addEventListener("blur", validateFullName)
fullNameInput.addEventListener("input", () => {
  if (fullNameError.textContent !== "") {
    validateFullName()
  }
})

genderInputs.forEach((input) => {
  input.addEventListener("change", validateGender)
})

emailInput.addEventListener("blur", validateEmail)
emailInput.addEventListener("input", () => {
  if (emailError.textContent !== "") {
    validateEmail()
  }
})

passwordInput.addEventListener("blur", validatePassword)
passwordInput.addEventListener("input", () => {
  checkPasswordStrength()
  if (passwordError.textContent !== "") {
    validatePassword()
  }
  if (confirmPasswordInput.value !== "") {
    validateConfirmPassword()
  }
})

confirmPasswordInput.addEventListener("blur", validateConfirmPassword)
confirmPasswordInput.addEventListener("input", () => {
  if (confirmPasswordError.textContent !== "") {
    validateConfirmPassword()
  }
})

registerForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const isFullNameValid = validateFullName()
  const isGenderValid = validateGender()
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()
  const areTermsAccepted = validateTerms()

  if (
    isFullNameValid &&
    isGenderValid &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid &&
    areTermsAccepted
  ) {
    alert("Registration successful! Thank you for signing up.")
    registerForm.reset()
    strengthBar.style.width = "0"
    strengthText.textContent = "Password strength"
  }
})


