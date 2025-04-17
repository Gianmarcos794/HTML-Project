// API configuration
const API_KEY = '1'; // Using the test API key
const BASE_URL = 'https://www.themealdb.com/api/json/v1';

// DOM elements
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');
const randomRecipesContainer = document.getElementById("randomRecipes");
const recipeModal = document.getElementById('recipeModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const categoriesBtn = document.getElementById("categoriesBtn");
const categoriesDropdown = document.getElementById("categoriesDropdown");
const recipesHeading = document.getElementById("recipesHeading");

// Function to display 6 random recipes
function displayRandomRecipes() {
  randomRecipesContainer.innerHTML = ""; // Clear the container before adding new recipes

  const mealPromises = [];
  for (let i = 0; i < 6; i++) {
    mealPromises.push(
      fetch(`${BASE_URL}/${API_KEY}/random.php`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch random recipe");
          }
          return response.json();
        })
        .then(data => data.meals[0])
    );
  }

  Promise.all(mealPromises)
    .then(meals => {
      meals.forEach(recipe => {
        const recipeCard = `
          <div class="recipe-card">
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <div class="recipe-info">
              <h3>${recipe.strMeal}</h3>
              <p>${recipe.strCategory}</p>
              <button class="details-btn" onclick="fetchRecipeDetails('${recipe.idMeal}')">Details</button>
            </div>
          </div>
        `;
        randomRecipesContainer.innerHTML += recipeCard;
      });
    })
    .catch(error => {
      console.error("Error fetching random recipes:", error);
      randomRecipesContainer.innerHTML = "<p>Failed to load recipes. Please try again later.</p>";
    });
}

// Handle search functionality
function handleSearch() {
  const query = searchInput.value.trim();

  if (query) {
    randomRecipesContainer.innerHTML = "<p>Loading...</p>"; // Show loading message

    const url = `${BASE_URL}/${API_KEY}/search.php?s=${encodeURIComponent(query)}`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.meals) {
          randomRecipesContainer.innerHTML = ""; // Clear the container
          data.meals.forEach(recipe => {
            const recipeCard = `
              <div class="recipe-card">
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                <div class="recipe-info">
                  <h3>${recipe.strMeal}</h3>
                  <p>${recipe.strCategory}</p>
                  <button class="details-btn" onclick="fetchRecipeDetails('${recipe.idMeal}')">Details</button>
                  <button class="like-btn" onclick="likeRecipe('${recipe.strMeal}')">Like</button>
                </div>
              </div>
            `;
            randomRecipesContainer.innerHTML += recipeCard;
          });
        } else {
          randomRecipesContainer.innerHTML = "<p>No recipes found. Try a different search.</p>";
        }
      })
      .catch(error => {
        console.error('Error searching recipes:', error);
        randomRecipesContainer.innerHTML = "<p>An error occurred. Please try again later.</p>";
      });
  }
}

// Open modal with recipe details
function openModal(recipe) {
  modalTitle.textContent = recipe.strMeal;
  modalBody.innerHTML = `
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="modal-image">
    <h4>Category: ${recipe.strCategory}</h4>
    <h4>Ingredients:</h4>
    <ul>
      ${Object.keys(recipe)
        .filter(key => key.startsWith("strIngredient") && recipe[key])
        .map(key => `<li>${recipe[key]} - ${recipe[`strMeasure${key.slice(13)}`]}</li>`)
        .join("")}
    </ul>
    <h4>Instructions:</h4>
    <p>${recipe.strInstructions}</p>
    ${recipe.strYoutube ? `
      <div class="modal-section">
        <h4 class="modal-section-title">Video Tutorial</h4>
        <p><a href="${recipe.strYoutube}" target="_blank">Watch on YouTube</a></p>
      </div>
    ` : ""}
  `;
  recipeModal.style.display = "block";
}

// Close modal
function closeModal() {
  recipeModal.style.display = 'none';
}

// Fetch recipe details
function fetchRecipeDetails(idMeal) {
  const url = `${BASE_URL}/${API_KEY}/lookup.php?i=${idMeal}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch recipe details");
      }
      return response.json();
    })
    .then(data => {
      const recipe = data.meals[0];
      openModal(recipe); // Pass the recipe object to the modal
    })
    .catch(error => {
      console.error("Error fetching recipe details:", error);
      alert("Failed to load recipe details. Please try again later.");
    });
}

// Toggle categories dropdown
categoriesBtn.addEventListener("click", () => {
  categoriesDropdown.classList.toggle("active"); // Toggle the "active" class
  if (categoriesDropdown.classList.contains("active")) {
    displayCategories(); // Load categories when the dropdown is shown
  }
});

// Function to fetch and display categories as list items
function displayCategories() {
  const categoryButtonsContainer = document.getElementById("categoriesDropdown");
  categoryButtonsContainer.innerHTML = ""; // Clear existing items

  fetch(`${BASE_URL}/${API_KEY}/categories.php`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    })
    .then(data => {
      const categories = data.categories;

      categories.forEach(category => {
        const listItem = document.createElement("li");
        listItem.textContent = category.strCategory;
        listItem.onclick = () => fetchRecipesByCategory(category.strCategory);
        categoryButtonsContainer.appendChild(listItem);
      });
    })
    .catch(error => {
      console.error("Error fetching categories:", error);
      categoryButtonsContainer.innerHTML = "<li>Failed to load categories</li>";
    });
}

// Function to fetch and display recipes by category
function fetchRecipesByCategory(category) {
  const randomRecipesContainer = document.getElementById("randomRecipes");

  // Update the heading with the selected category name
  recipesHeading.textContent = category;

  randomRecipesContainer.innerHTML = "<p>Loading...</p>"; // Show loading message

  fetch(`${BASE_URL}/${API_KEY}/filter.php?c=${encodeURIComponent(category)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch recipes by category");
      }
      return response.json();
    })
    .then(data => {
      const recipes = data.meals;

      randomRecipesContainer.innerHTML = ""; // Clear the container
      recipes.forEach(recipe => {
        const recipeCard = `
          <div class="recipe-card">
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <div class="recipe-info">
              <h3>${recipe.strMeal}</h3>
              <button class="details-btn" onclick="fetchRecipeDetails('${recipe.idMeal}')">Details</button>
              <button class="like-btn" onclick="likeRecipe('${recipe.strMeal}')">Like</button>
            </div>
          </div>
        `;
        randomRecipesContainer.innerHTML += recipeCard;
      });
    })
    .catch(error => {
      console.error("Error fetching recipes by category:", error);
      randomRecipesContainer.innerHTML = "<p>Failed to load recipes. Please try again later.</p>";
    });
}

// Function to like a recipe
function likeRecipe(recipeName) {
  // Retrieve existing likes from localStorage
  const likes = JSON.parse(localStorage.getItem("likes")) || [];

  // Check if the recipe is already liked
  if (likes.includes(recipeName)) {
    alert("You already liked this recipe!");
    return;
  }

  // Add the recipe to the likes array
  likes.push(recipeName);
  localStorage.setItem("likes", JSON.stringify(likes));
  alert(`You liked "${recipeName}"!`);
}

// Call the function to display categories on page load
document.addEventListener("DOMContentLoaded", () => {
  displayCategories();
  displayRandomRecipes(); // Ensure random recipes are still displayed on page load
});

// Set up event listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    handleSearch();
  }
});
modalClose.addEventListener('click', closeModal);
recipeModal.addEventListener('click', function (e) {
  if (e.target === recipeModal) {
    closeModal();
  }
});
