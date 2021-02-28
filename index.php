<!DOCTYPE html>
<html>
<head>
    <title id="title">Tetris</title>
    <script src="./main.min.js"></script>
    <link rel="stylesheet" type="text/css" href="./style.css"/>
</head>
<body>
    <div id="wrapper" class="centered">
        <div id="main">
            <div id="container">
                <div id="canvas" class="centered">
                    <div id="pause" class="menu-screen" style="display: none">
                        <div class="centered menu-content">
                            <h1>paused</h1>
                            <a href="javascript:;" id="pauseBtn">resume</a>
                            <a href="javascript:;" onclick="restart()">restart</a>
                            <a href="javascript:;" onclick="showMenuScreen()">quit</a>
                        </div>
                    </div>
                    <div id="main-menu" class="menu-screen" style="display: block">
                        <div class="centered menu-content">
                            <h1>tetris</h1>
                            <a href="javascript:;" onclick="startGame()">start</a>
                            <a href="javascript:;" onclick="showHighscores(showMenuScreen)">highscores</a>
                        </div>
                    </div>
                    <div id="submit-menu" class="menu-screen" style="display: none">
                        <div class="centered menu-content">
                            <h1>submit your score</h1>
                            <form method="post">
                                <input type="text" name="name" maxlength="17" placeholder="name" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
                                <input style="display: none" type="submit" id="submit"/>
                            </form>
                            <a href="javascript:;" onclick="document.getElementById('submit').click()">submit</a>
                            <br>
                            <br>
                            <br>
                            <a href="javascript:;" onclick="showGameOverScreen()">back</a>
                        </div>
                    </div>
                    <div id="errors-menu" class="menu-screen" style="display: none">
                        <div class="centered menu-content">
                            <h1 id="error"></h1>
                            <a href="javascript:;" id="er-back" onclick="showMenuScreen()">okay</a>
                        </div>
                    </div>
                    <div id="highscores" class="menu-screen" style="display: none">
                        <div id="hs-menu-content" class="centered menu-content">
                            <h1>highscores</h1>
                            <div id="hs-scroll"></div>
                            <a href="javascript:;" id="hs-back" onclick="showMenuScreen()">back</a>
                        </div>
                    </div>
                    <div id="game-over" class="menu-screen faded-menu-screen" style="display: none">
                        <div class="centered menu-content">
                            <h1>game over</h1>
                            <a href="javascript:;" onclick="restart()">retry</a>
                            <a href="javascript:;" onclick="showSubmitScreen()">submit your score</a>
                            <a href="javascript:;" onclick="showMenuScreen()">main menu</a>
                        </div>
                    </div>
                    <div id="preview"></div>
                </div>
            </div>
        </div>
        <div id="sidebar">
            <div id="hold" class="sidebar-item">
                <h1>hold</h1>
                <div id="hold-content" class="sidebar-item-content">
                    <div id="hold-block" class="centered"></div>
                </div>
            </div>
            <div id="next" class="sidebar-item">
                <h1>next</h1>
                <div id="next-content" class="sidebar-item-content">
                    <div id="next-block" class="centered"></div>
                </div>
            </div>
            <div class="sidebar-item">
                <div class="sidebar-inline-content">
                    <h1 class="sidebar-inline sidebar-inline-left">score:</h1>
                    <h1 class="sidebar-inline sidebar-inline-right" id="score">0</h1>
                </div>
            </div>
            <div class="sidebar-item">
                <div class="sidebar-inline-content">
                    <h1 class="sidebar-inline sidebar-inline-left">lines:</h1>
                    <h1 class="sidebar-inline sidebar-inline-right" id="lines">0</h1>
                </div>
            </div>
            <div class="sidebar-item">
                <h1 class="tooltip">controls<span class="tooltiptext">
                    ←/→/↓: move<br/>
                    ↑/Q/W: rotate<br/>
                    P: pause<br/>
                    RShift: hold
                </span></h1>
            </div>
        </div>
    </div>
</body>
</html>