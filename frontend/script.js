document.addEventListener('DOMContentLoaded', () => {
	const API_URL = 'http://localhost:3000/api/students'

	const studentForm = document.getElementById('student-form')
	const nameInput = document.getElementById('name')
	const surnameInput = document.getElementById('surname')
	const lastnameInput = document.getElementById('lastname')
	const birthdayInput = document.getElementById('birthday')
	const studyStartInput = document.getElementById('studyStart')
	const facultyInput = document.getElementById('faculty')

	const filterNameInput = document.getElementById('filter-name')
	const filterFacultyInput = document.getElementById('filter-faculty')
	const filterStudyStartInput = document.getElementById('filter-studyStart')
	const filterGraduationYearInput = document.getElementById(
		'filter-graduationYear'
	)

	const studentTableBody = document.getElementById('student-table-body')

	let students = []
	let sortDirection = {
		fullName: 1,
		faculty: 1,
		birthday: 1,
		studyStart: 1,
	}

	const fetchStudents = async () => {
		try {
			const response = await fetch(API_URL)
			students = await response.json()
			renderStudents()
		} catch (error) {
			console.error('Ошибка при получении списка студентов:', error)
		}
	}

	const renderStudents = () => {
		const filterName = filterNameInput.value.trim().toLowerCase()
		const filterFaculty = filterFacultyInput.value.trim().toLowerCase()
		const filterStudyStart = filterStudyStartInput.value.trim()
		const filterGraduationYear = filterGraduationYearInput.value.trim()

		const filteredStudents = students.filter(student => {
			const fullName =
				`${student.surname} ${student.name} ${student.lastname}`.toLowerCase()
			const graduationYear = parseInt(student.studyStart) + 4
			return (
				fullName.includes(filterName) &&
				student.faculty.toLowerCase().includes(filterFaculty) &&
				(!filterStudyStart || student.studyStart === filterStudyStart) &&
				(!filterGraduationYear ||
					graduationYear === parseInt(filterGraduationYear))
			)
		})

		filteredStudents.sort((a, b) => {
			const column = currentSortColumn
			const direction = sortDirection[column]
			if (column === 'birthday') {
				return direction * (new Date(a.birthday) - new Date(b.birthday))
			}
			if (column === 'studyStart') {
				return direction * (parseInt(a.studyStart) - parseInt(b.studyStart))
			}
			if (column === 'fullName') {
				return (
					direction *
					(a.surname + a.name + a.lastname).localeCompare(
						b.surname + b.name + b.lastname
					)
				)
			}
			if (column === 'faculty') {
				return direction * a.faculty.localeCompare(b.faculty)
			}
			return 0
		})

		studentTableBody.innerHTML = filteredStudents
			.map(student => createStudentRow(student))
			.join('')
	}

	const createStudentRow = student => {
		const age = calculateAge(student.birthday)
		const graduationYear = parseInt(student.studyStart) + 4
		const currentYear = new Date().getFullYear()
		const currentMonth = new Date().getMonth() + 1
		const course =
			currentYear > graduationYear ||
			(currentYear === graduationYear && currentMonth >= 9)
				? 'закончил'
				: `${currentYear - student.studyStart + 1} курс`

		return `
      <tr>
        <td>${student.lastname} ${student.name} ${student.surname}</td>
        <td>${student.faculty}</td>
        <td>${formatDate(student.birthday)} (${age} лет)</td>
        <td>${student.studyStart}-${graduationYear} (${course})</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${
						student.id
					}')">Удалить</button>
        </td>
      </tr>
    `
	}

	const calculateAge = birthday => {
		const birthDate = new Date(birthday)
		const today = new Date()
		let age = today.getFullYear() - birthDate.getFullYear()
		const m = today.getMonth() - birthDate.getMonth()
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--
		}
		return age
	}

	const formatDate = dateString => {
		const options = { day: '2-digit', month: '2-digit', year: 'numeric' }
		return new Date(dateString).toLocaleDateString('ru-RU', options)
	}

	window.deleteStudent = async id => {
		try {
			await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
			students = students.filter(student => student.id !== id)
			renderStudents()
		} catch (error) {
			console.error('Ошибка при удалении студента:', error)
		}
	}

	studentForm.addEventListener('submit', async event => {
		event.preventDefault()

		const newStudent = {
			name: nameInput.value.trim(),
			surname: surnameInput.value.trim(),
			lastname: lastnameInput.value.trim(),
			birthday: birthdayInput.value,
			studyStart: studyStartInput.value.trim(),
			faculty: facultyInput.value.trim(),
		}

		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newStudent),
			})

			const createdStudent = await response.json()
			students.push(createdStudent)
			renderStudents()

			studentForm.reset()
		} catch (error) {
			console.error('Ошибка при добавлении студента:', error)
		}
	})

	filterNameInput.addEventListener('input', renderStudents)
	filterFacultyInput.addEventListener('input', renderStudents)
	filterStudyStartInput.addEventListener('input', renderStudents)
	filterGraduationYearInput.addEventListener('input', renderStudents)

	let currentSortColumn = 'fullName'

	document.querySelectorAll('th').forEach((th, index) => {
		th.addEventListener('click', () => {
			const columns = ['fullName', 'faculty', 'birthday', 'studyStart']
			const column = columns[index]
			if (currentSortColumn === column) {
				sortDirection[column] *= -1
			} else {
				currentSortColumn = column
				sortDirection = {
					fullName: 1,
					faculty: 1,
					birthday: 1,
					studyStart: 1,
				}
				sortDirection[column] = 1
			}
			renderStudents()
		})
	})

	fetchStudents()
})
