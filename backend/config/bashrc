# ~/.bashrc: executed by bash(1) for non-login shells.

# If not running interactively, don't do anything
[ -z "$PS1" ] && return

# don't put duplicate lines in the history
export HISTCONTROL=ignoredups

# check the window size after each command
shopt -s checkwinsize

# make less more friendly for non-text input files
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set a fancy prompt
PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '

# enable color support
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# 사용자 환경 변수 설정
export PATH=$PATH:/usr/local/bin


# 사용자 별칭 설정
alias cls='clear'
alias py='python3'
alias update='apt-get update && apt-get upgrade -y'

# 미리 정의된 함수들
function mkcd() {
    mkdir -p "$1" && cd "$1"
}

echo "Bash configuration loaded successfully."

# cd /app

# if ! netstat -tuln | grep ":11302" ; then
#   nohup uvicorn server_mysql:app --reload --host=0.0.0.0 --port=11302 > output.log 2>&1 &
# fi

# if ! netstat -tuln | grep ":11301" ; then
#   nohup uvicorn server_spider:app --reload --host=0.0.0.0 --port=11301 > output.log 2>&1 &
# fi

# if ! netstat -tuln | grep ":11303" ; then
#   nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=11303 > output.log 2>&1 &
# fi

# if ! netstat -tuln | grep ":11307" ; then
#   nohup uvicorn server_board:app --reload --host=0.0.0.0 --port=11307 > output.log 2>&1 &
# fi

# service cron restart
