import psutil
import pygetwindow as gw
import win32process
import time
import win32api
from datetime import datetime
import json


# Pid functions
def getFileDescription(windows_exe):
    # https://stackoverflow.com/questions/31118877/get-application-name-from-exe-file-in-python (modified)
    try:
        language, codepage = win32api.GetFileVersionInfo(windows_exe, '\\VarFileInfo\\Translation')[0]
        stringFileInfo = u'\\StringFileInfo\\%04X%04X\\%s' % (language, codepage, "FileDescription")
        description = win32api.GetFileVersionInfo(windows_exe, stringFileInfo)
    except:
        description = exe_nopath(windows_exe)

    if description:
        return description
    else:
        return exe_nopath(windows_exe)
    
def exe_nopath(path):
    rev = path[::-1]
    index = len(path) - 1 - rev.index('\\')
    return path[(index + 1):]

def get_exe(pid):
    try:
        process = psutil.Process(pid)
        process_path = process.exe()
        return process_path
    except:
        return None
    
def pid_to_name(pid):
    return getFileDescription(get_exe(pid))
    
def activewindow():
    try:
        return win32process.GetWindowThreadProcessId(gw.getActiveWindow()._hWnd)[1]
    except AttributeError:
        return None


# Datetime
def get_current_date():
    date_time = str(datetime.now())
    return date_time[:10]

def get_current_hour():
    return str(datetime.now())[11:13]

def get_current_minute():
    return str(datetime.now())[14:16]


# Durations functions
def in_durations(app):
    try:
        durations[DATE][app][HOUR]
        return True
    except KeyError:
        return False
    
def durations_update(app, sec):
    durations[DATE][app][HOUR] = sec

def durations_add(app, sec):
    try:
        durations[DATE][app].update({HOUR : sec})
    except:
        durations[DATE].update({app : {HOUR : sec}})        

def get_durations_duration(app):
    return durations[DATE][app][HOUR]

def durations_load(app, sec):
    with open('log.json', 'r') as f:
        if f.read():
            f.seek(0)
            log = json.loads(f.read())
        
        # In order to load the durations with DATE, I require a value to the key (DATE), so we need the (app, sec) as input        
            element = date_from_list(log)
            if element:
                return element

        # Date is not in the log
        return {DATE : {app : {HOUR : sec}}}


def json_update_hour():
    with open('log.json', 'a+') as f:
        try:
            f.seek(0)
            log = json.loads(f.read())
            element = date_from_list(log)
            if element:
                log.remove(element)
                log.append(durations)
            else:
                log.append(durations)

            f.truncate(0)
            json.dump(log, f)

        except:
            f.truncate(0)
            json.dump([durations], f)


def json_autosave_minute():
    # Log to json
    with open('log.json', 'a+') as f:
        try:
            f.seek(0)
            log = json.loads(f.read())
            element = date_from_list(log)
            if element:
                log.remove(element)
                log.append(durations)
            else:
                log.append(durations)

            f.truncate(0)
            json.dump(log, f)

        except:
            f.truncate(0)
            json.dump([durations], f)

    # Log to JS file
    with open('log.json') as file:
        json_variable = 'const json = {json}\n'.format(json = file.read())

    with open('html/main.js') as file:
        lines = file.readlines()
        lines[0] = json_variable

    with open('html/main.js', 'w') as file:
        file.writelines(lines)
    print("Logged to JS.")

                
def date_from_list(json_dict):
    for element in json_dict:
            for date in element:
                if date == DATE:
                    return element
    return None



# Main
last = activewindow()
last_name = pid_to_name(last)

HOUR = get_current_hour()
DATE = get_current_date()
MINUTE = get_current_minute()
SECONDS = 0


# If the file doesn't exist, this will create it
f = open('log.json', "a+")
f.close()

durations = durations_load(last_name, 0)

if not in_durations(last_name):
    durations_add(last_name, 0)

print(durations)


while True:
    now = activewindow()

    if now:
        # If activewindow has changed,
        if now != last:

            now_name = pid_to_name(now)

            # Update the final time for the previous app
            durations_update(last_name, SECONDS)

            # Get time for current app
            if in_durations(now_name):
                SECONDS = get_durations_duration(now_name)
            else:
                SECONDS = 0 
                durations_add(now_name, 0)

            last = now
            last_name = now_name
            print(durations)
            print()


        if MINUTE != get_current_minute():
            durations_update(last_name, SECONDS)

            json_autosave_minute()
            MINUTE = get_current_minute()


        if HOUR != get_current_hour():

            durations_update(last_name, SECONDS)
            SECONDS = 0

            json_update_hour()

            HOUR = get_current_hour()


        if DATE != get_current_date():
            durations = {}
            DATE = get_current_date()

            last = activewindow()
            last_name = pid_to_name(last)

            durations = durations_load(last_name, 0)

            if not in_durations(last_name):
                durations_add(last_name, 0)


        time.sleep(1)
        SECONDS += 1
