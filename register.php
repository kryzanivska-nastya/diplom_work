<?php
// Виведення всіх помилок для відлагодження
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "root";
$dbname = "game_blog";

// Створення з'єднання
$conn = new mysqli($servername, $username, $password, $dbname);

// Перевірка з'єднання
if ($conn->connect_error) {
    die("З'єднання не вдалося: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user = $_POST['username'];
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, password) VALUES ('$user', '$pass')";

    if ($conn->query($sql) === TRUE) {
        // Перенаправлення на сторінку логіну
        header("Location: login.html");
        exit();
    } else {
        echo "Помилка: " . $sql . "<br>" . $conn->error;
    }

    $conn->close();
}
?>
