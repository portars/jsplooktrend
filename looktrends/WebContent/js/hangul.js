function isHangul(c) {
	if(!((c > 0x3130 && c < 0x318F) || (c >= 0xAC00 && c <= 0xD7A3)))
		return 0;
	return 1;
}