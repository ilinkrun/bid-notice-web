import re
from datetime import datetime
import codecs
import html
import os
from utils_mysql import Mysql
from utils_data import (find_folders)


# def get_com_sn_org_from_folder(folder='[일맥] 15. 종로구청(60)'):
#     (com, sn, org) = ('', 1, '')
#     if folder[0] == '[':
#        com = folder[1:].split(']')[0]
#     if '.' in folder:
#        sn = folder.replace(f"[{com}]", "").split('.')[0].strip()
#     org = folder.replace(f"[{com}]", "").replace(f"{sn}.", "").replace(f"{sn} .", "").strip().split("(")[0]
#     return (com, sn, org)

# def get_folder_from_com_sn_org(com="일맥", sn=1, org="가평군청"):
#    return f"[{com}] {str(sn).zfill(3)}. {org}"

# def get_max_sn_org_folder(root_path = '/nas/24_공사점검/3 . 용역 입찰공고', com="일맥"):
#     try:
#        return max([int(get_com_sn_org_from_folder(folder)[1]) for folder in find_folders(root_path, search=f"[{com}]")])
#     except:
#        return 0

# def _find_notice_folder_by_org(root_path = '/nas/24_공사점검/3 . 용역 입찰공고', company='일맥', org_name='종로구청'):
#     dirs = list(filter(lambda folder: org_name == get_com_sn_org_from_folder(folder)[2], find_folders(root_path)))
#     if len(dirs) == 1:
#         return dirs[0]
#     else: # 없거나 여러개(?) 이면
#        sn = get_max_sn_org_folder(root_path, company)
#        return f"{root_path}/[{company}] {sn+1}. {org_name}"

# # * find notice folder
# def find_notice_folder(category="공사점검", company='일맥', org_name='종로구청'):
#     return _find_notice_folder_by_org(find_dir_bid_notice(category), company, org_name)

# def get_max_sn_notice_folder(category="공사점검", company='일맥', org_name='종로구청'):
#     root_path = find_notice_folder(category, company, org_name)

# * NAS 폴더, 파일
def get_notice_category_org_com(nid):
    mysql = Mysql()
    result1 = mysql.find("notices", fields=['기관명', 'category', '제목'], addStr=f"WHERE nid = {nid}")
    [기관명, category, 제목] = list(result1[0])
    result2 = mysql.find("settings_list", fields=['oid', '담당업체'], addStr=f"WHERE `기관명` = '{기관명}'")
    [oid, 담당업체] = list(result2[0])
    mysql.close()
    if not category: 
        category = '공사점검' #!!! 디폴트값

    return [기관명, category, 제목, oid, 담당업체]


def get_nas_folder(name='root', level=1):
    mysql = Mysql()
    result = mysql.find("settings_nas_folder", fields=['folder'], addStr=f"WHERE name = '{name}' AND level={level}")
    mysql.close()
    return result[0][0]

# 해당 기관 폴더내에 있는 하위폴더 개수 + 1
def get_notice_folder_num(title, parent_dir = '/nas/_ilmac'):
    folders = find_folders(parent_dir)
    for folder in folders:
        if title in folder:
            try:
                return int(folder.split(".")[0])
            except ValueError:
                continue
    return len(folders) + 1


def get_notice_nas_folder(nid):
    [기관명, category, 제목, oid, 담당업체] = get_notice_category_org_com(nid)

    levels = [['root', 1], [category, 2], ['공고', 3], ['기관명', 4], ['공고명', 5], ['공고파일', 6]]
    # print(levels)
    mysql = Mysql()
    paths = [(mysql.find("settings_nas_folder", fields=['folder'], addStr=f"WHERE name = '{level[0]}' AND level={level[1]}"))[0][0] for level in levels]
    mysql.close()
    # print(paths)

    # 실제 값으로 치환
    for i, path in enumerate(paths):
        path = path.replace('{담당업체}', str(담당업체))
        path = path.replace('{oid}', str(oid))
        path = path.replace('{기관명}', str(기관명))
        path = path.replace('{제목}', str(제목))
        paths[i] = path

    parent_path = "/".join(paths[:-2])
    num = get_notice_folder_num(제목, parent_path) # !!!제목이 일치하는 폴더 있는지 확인
    
    # print(f"Parent path: {parent_path}")
    return parent_path + "/" + paths[-2].replace('{num}', str(num)) + "/" + paths[-1]

if __name__ == "__main__":
    pass
    nid = 536548
    print(get_notice_nas_folder(nid))
