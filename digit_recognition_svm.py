import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn import datasets, svm, metrics
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
import joblib
import os

def load_and_preprocess():
    """
    Load the MNIST digits dataset, normalize it, and split into train/test sets.
    """
    print("Loading MNIST digits dataset...")
    # Load the digits dataset (8x8 images of digits 0-9)
    digits = datasets.load_digits()
    
    # Preprocessing: Flatten the images (8x8 -> 64 pixels)
    # The dataset already comes flattened in digits.data, but digits.images contains the 8x8 arrays.
    n_samples = len(digits.images)
    data = digits.images.reshape((n_samples, -1))
    
    # Normalize pixel values to [0, 1] range
    data = data / 16.0
    
    # --- Custom Data Integration ---
    import json
    custom_data_path = 'custom_training_data.json'
    if os.path.exists(custom_data_path):
        print(f"Loading custom training data from {custom_data_path}...")
        try:
            with open(custom_data_path, 'r') as f:
                custom_samples = json.load(f)
                if custom_samples:
                    custom_X = np.array([s['pixels'] for s in custom_samples])
                    custom_y = np.array([s['label'] for s in custom_samples])
                    
                    # Append custom data to original data
                    data = np.vstack([data, custom_X])
                    digits.target = np.concatenate([digits.target, custom_y])
                    print(f"Added {len(custom_samples)} custom samples.")
        except Exception as e:
            print(f"Error loading custom data: {e}")
    # -------------------------------
    
    # Split into train (80%) and test (20%) sets
    X_train, X_test, y_train, y_test = train_test_split(
        data, digits.target, test_size=0.2, shuffle=True, random_state=42
    )
    
    return X_train, X_test, y_train, y_test, digits

def tune_and_train(X_train, y_train):
    """
    Tune SVM hyperparameters C and gamma using GridSearchCV and train the model.
    """
    print("Tuning hyperparameters C and gamma...")
    # Define parameter grid for GridSearchCV
    param_grid = [
        {'C': [0.1, 1, 10, 100], 'gamma': [1, 0.1, 0.01, 0.001], 'kernel': ['rbf']}
    ]
    
    # Initialize SVM classifier with probability=True
    svc = svm.SVC(probability=True)
    
    # Use GridSearchCV to find the best parameters
    clf = GridSearchCV(svc, param_grid, cv=5, scoring='accuracy', verbose=1)
    clf.fit(X_train, y_train)
    
    print(f"Best parameters found: {clf.best_params_}")
    return clf.best_estimator_

def evaluate_model(model, X_test, y_test):
    """
    Evaluate the model using accuracy, confusion matrix, and classification report.
    """
    print("Evaluating model performance...")
    # Predict on test set
    predicted = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = metrics.accuracy_score(y_test, predicted)
    print(f"Test Accuracy: {accuracy * 100:.2f}%")
    
    # Detailed classification report
    print("\nClassification Report:")
    print(metrics.classification_report(y_test, predicted))
    
    # Confusion Matrix
    cm = metrics.confusion_matrix(y_test, predicted)
    return predicted, cm

def plot_results(digits, X_test, y_test, predicted, cm):
    """
    Plot sample digits, confusion matrix, and predictions.
    """
    print("Generating plots...")
    
    # 1. Plot sample digits
    plt.figure(figsize=(10, 4))
    for index, (image, label) in enumerate(zip(digits.images[:5], digits.target[:5])):
        plt.subplot(1, 5, index + 1)
        plt.imshow(image, cmap=plt.cm.gray_r, interpolation='nearest')
        plt.title(f'Target: {label}')
        plt.axis('off')
    plt.tight_layout()
    plt.savefig('sample_digits.png')
    plt.show()

    # 2. Confusion Matrix Heatmap
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.xlabel('Predicted Label')
    plt.ylabel('Actual Label')
    plt.title('Confusion Matrix Heatmap')
    plt.savefig('confusion_matrix.png')
    plt.show()

    # 3. Predicted vs Actual samples
    plt.figure(figsize=(12, 6))
    # Pick 10 random samples from the test set
    indices = np.random.choice(len(X_test), 10, replace=False)
    for i, idx in enumerate(indices):
        plt.subplot(2, 5, i + 1)
        plt.imshow(X_test[idx].reshape(8, 8), cmap=plt.cm.gray_r, interpolation='nearest')
        color = 'green' if predicted[idx] == y_test[idx] else 'red'
        plt.title(f'P: {predicted[idx]}, A: {y_test[idx]}', color=color)
        plt.axis('off')
    plt.suptitle('Predicted (P) vs Actual (A) Labels')
    plt.tight_layout()
    plt.savefig('predictions_vs_actual.png')
    plt.show()

def save_model(model, filename='svm_digit_model.joblib'):
    """
    Save the trained model using joblib.
    """
    print(f"Saving model to {filename}...")
    joblib.dump(model, filename)
    print("Model saved successfully.")

def predict_new_image(model, image_data):
    """
    Predict the digit for a new 8x8 image.
    image_data should be a flattened 64-element array normalized between 0-1.
    """
    prediction = model.predict(image_data.reshape(1, -1))
    return prediction[0]

if __name__ == "__main__":
    # 1. Load and Preprocess
    X_train, X_test, y_train, y_test, digits_data = load_and_preprocess()
    
    # 2. Tune and Train
    best_svm = tune_and_train(X_train, y_train)
    
    # 3. Evaluate
    predictions, confusion_mtx = evaluate_model(best_svm, X_test, y_test)
    
    # 4. Visualize
    plot_results(digits_data, X_test, y_test, predictions, confusion_mtx)
    
    # 5. Save Model
    save_model(best_svm)
    
    # Example of using the predict() function
    print("\nDemonstrating predict() on a single test sample:")
    sample_idx = 0
    sample_img = X_test[sample_idx]
    actual_label = y_test[sample_idx]
    predicted_label = predict_new_image(best_svm, sample_img)
    print(f"Predicted: {predicted_label}, Actual: {actual_label}")
