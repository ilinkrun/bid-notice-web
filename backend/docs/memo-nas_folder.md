settings_nas_path

name	area	depth	folder	remark
root	1	notice	/nas	root
공사점검	notice	2	24_공사점검
성능평가	notice	2	13_성능평가
기타	notice	2	31_기타용역
공고	notice	3	3. 용역 입찰공고	입찰공고
기관명	notice	4	[{담당업체}] {oid}. {기관명}
공고명	notice	5	{num}. {제목}

get_folder_by_nid(nid)
  [category, org, com, title] = get_notice_category_org_com(nid)
  path = get_root_folder()
  depth2 = get_category_folder(category)
  depth3 = get_notice_folder()
  depth4 = get_org_folder(com, org, com)
  depth5 = get_title_folder(title)
  return f"{depth1}/{depth2}/{depth3}/{depth4}/{depth5}"


get_nas_folder(name, depth)
